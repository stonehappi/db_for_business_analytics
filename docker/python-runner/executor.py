import ast
import base64
import io
import time
import traceback
from typing import Any, Dict, List, Optional
import multiprocessing as mp

# Prohibited modules and attributes for safe sandboxed execution
PROHIBITED_MODULES = {
    'os', 'sys', 'subprocess', 'shutil', 'socket', 'pty', 'commands',
    'multiprocessing', 'ctypes', 'importlib', 'pickle', 'shelve',
    'http', 'urllib', 'requests', 'httpx', 'webbrowser', 'signal',
    'posix', 'nt', 'winreg'
}

PROHIBITED_CALLS = {
    'eval', 'exec', '__import__', 'compile', 'breakpoint',
    'globals', 'locals', 'vars', 'dir'
}

PROHIBITED_ATTRS = {
    '__subclasses__', '__bases__', '__globals__', '__code__',
    '__closure__', '__builtins__', '__import__'
}

def analyze_ast_security(code_str: str) -> Optional[str]:
    """
    Parses code into AST and inspects imports, function calls, and attribute access.
    Returns error string if a security violation is found, else None.
    """
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        return f"SyntaxError in submission: {e}"

    for node in ast.walk(tree):
        # 1. Inspect import statements: import x
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_module = alias.name.split('.')[0]
                if root_module in PROHIBITED_MODULES:
                    return f"Security Violation: Import of '{root_module}' is strictly prohibited."

        # 2. Inspect from x import y
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root_module = node.module.split('.')[0]
                if root_module in PROHIBITED_MODULES:
                    return f"Security Violation: Import from '{root_module}' is strictly prohibited."

        # 3. Inspect dangerous function calls
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in PROHIBITED_CALLS:
                    return f"Security Violation: Calling '{node.func.id}()' is prohibited in sandbox."

        # 4. Inspect dunder attribute traversal (e.g. obj.__class__.__subclasses__)
        elif isinstance(node, ast.Attribute):
            if node.attr in PROHIBITED_ATTRS:
                return f"Security Violation: Accessing attribute '{node.attr}' is prohibited."

    return None

def _run_worker(code_str: str, verification_code: Optional[str], sandbox_db_url: Optional[str], result_queue: mp.Queue):
    """
    Worker function executed in an isolated process.
    """
    import sys
    import matplotlib
    matplotlib.use('Agg')  # Headless backend
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd

    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    sys.stdout = stdout_capture
    sys.stderr = stderr_capture

    start_time = time.perf_counter()

    # Base execution environment
    exec_globals: Dict[str, Any] = {
        'pd': pd,
        'pandas': pd,
        'np': np,
        'numpy': np,
        'plt': plt,
        '__name__': '__main__',
    }

    # Optional seaborn injection
    try:
        import seaborn as sns
        exec_globals['sns'] = sns
        exec_globals['seaborn'] = sns
    except ImportError:
        pass

    # Optional database connection injection
    db_engine = None
    if sandbox_db_url:
        try:
            from sqlalchemy import create_engine
            # Ensure psycopg2 driver is used for postgresql URIs
            url_to_use = sandbox_db_url
            if url_to_use.startswith('postgresql://'):
                url_to_use = 'postgresql+psycopg2://' + url_to_use[len('postgresql://'):]
            db_engine = create_engine(url_to_use, pool_pre_ping=True)
            exec_globals['engine'] = db_engine
            exec_globals['db_engine'] = db_engine
            exec_globals['conn'] = db_engine
        except Exception as e:
            sys.stderr.write(f"Warning: Could not initialize database engine: {e}\n")

    exec_locals: Dict[str, Any] = {}

    try:
        compiled_student_code = compile(code_str, '<student_submission>', 'exec')
        exec(compiled_student_code, exec_globals, exec_locals)

        # Merge local updates into globals so verification script can see them
        exec_globals.update(exec_locals)

        # 1. Capture Matplotlib Figures
        plots: List[Dict[str, str]] = []
        fig_nums = plt.get_fignums()
        for num in fig_nums:
            fig = plt.figure(num)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
            buf.seek(0)
            img_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')
            plots.append({
                'format': 'png',
                'base64': img_b64
            })
            plt.close(fig)
        plt.close('all')

        # 2. Extract DataFrames & Series
        tables: List[Dict[str, Any]] = []
        for var_name, var_val in list(exec_locals.items()):
            if isinstance(var_val, pd.DataFrame):
                df_sample = var_val.head(50)
                # Convert timestamps and NaNs safely for JSON
                preview_records = df_sample.fillna('').astype(str).to_dict(orient='records')
                columns_meta = [{'name': str(col), 'type': str(var_val[col].dtype)} for col in var_val.columns]
                tables.append({
                    'variableName': var_name,
                    'rowCount': len(var_val),
                    'columnCount': len(var_val.columns),
                    'columns': columns_meta,
                    'rows': preview_records
                })
            elif isinstance(var_val, pd.Series):
                series_df = var_val.head(50).reset_index()
                preview_records = series_df.fillna('').astype(str).to_dict(orient='records')
                columns_meta = [{'name': str(col), 'type': str(series_df[col].dtype)} for col in series_df.columns]
                tables.append({
                    'variableName': var_name,
                    'rowCount': len(var_val),
                    'columnCount': 2,
                    'columns': columns_meta,
                    'rows': preview_records
                })

        # 3. Execute Verification Assertions if provided
        test_results = None
        if verification_code and verification_code.strip():
            try:
                compiled_verify = compile(verification_code, '<verification_assertions>', 'exec')
                exec(compiled_verify, exec_globals, exec_locals)
                test_results = {
                    'passed': True,
                    'scoreEstimate': 100,
                    'details': 'All automated Python test assertions passed successfully.'
                }
            except AssertionError as ae:
                test_results = {
                    'passed': False,
                    'scoreEstimate': 50,
                    'details': f"Assertion failed: {str(ae) or 'Condition was not satisfied.'}"
                }
            except Exception as te:
                test_results = {
                    'passed': False,
                    'scoreEstimate': 0,
                    'details': f"Verification error: {type(te).__name__}: {str(te)}"
                }

        sys.stdout = old_stdout
        sys.stderr = old_stderr

        exec_time = round((time.perf_counter() - start_time) * 1000, 1)

        result_queue.put({
            'status': 'success',
            'executionTimeMs': exec_time,
            'stdout': stdout_capture.getvalue(),
            'stderr': stderr_capture.getvalue(),
            'tables': tables,
            'plots': plots,
            'testResults': test_results
        })

    except Exception as e:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        exec_time = round((time.perf_counter() - start_time) * 1000, 1)
        err_msg = traceback.format_exc()

        result_queue.put({
            'status': 'syntax_error',
            'error': f"{type(e).__name__}: {str(e)}",
            'details': err_msg,
            'stdout': stdout_capture.getvalue(),
            'stderr': stderr_capture.getvalue(),
            'executionTimeMs': exec_time
        })
    finally:
        if db_engine:
            try:
                db_engine.dispose()
            except Exception:
                pass


def execute_python_code(
    code_str: str,
    verification_code: Optional[str] = None,
    sandbox_db_url: Optional[str] = None,
    timeout_seconds: float = 5.0
) -> Dict[str, Any]:
    """
    Public entry point to execute Python code with security validation and hard timeout.
    """
    start_time = time.perf_counter()

    # 1. AST Security Audit
    security_err = analyze_ast_security(code_str)
    if security_err:
        return {
            'status': 'security_violation',
            'error': security_err,
            'executionTimeMs': round((time.perf_counter() - start_time) * 1000, 1)
        }

    # 2. Spawn isolated process with timeout
    result_queue: mp.Queue = mp.Queue()
    process = mp.Process(
        target=_run_worker,
        args=(code_str, verification_code, sandbox_db_url, result_queue)
    )

    process.start()
    process.join(timeout=timeout_seconds)

    if process.is_alive():
        process.terminate()
        process.join(timeout=1.0)
        if process.is_alive():
            try:
                process.kill()
            except AttributeError:
                pass

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)
        return {
            'status': 'timeout_error',
            'error': f'Python execution cancelled: exceeded {timeout_seconds}s execution timeout limit.',
            'executionTimeMs': elapsed_ms
        }

    if not result_queue.empty():
        return result_queue.get()
    else:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)
        return {
            'status': 'syntax_error',
            'error': 'Execution terminated abruptly with no output.',
            'executionTimeMs': elapsed_ms
        }
