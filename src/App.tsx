import { useAmexFile } from "./hooks/useAmexFile";
import { useYnabSync } from "./hooks/useYnabSync";
import { FileUpload } from "./components/FileUpload";
import { SyncToYnab } from "./components/SyncToYnab";
import { SyncStatus } from "./components/SyncStatus";
import "./App.css";

function App() {
  const { result, isLoading, selectedFile, handleFile, clear } = useAmexFile();
  const { status, lastResult, sync, reset } = useYnabSync();

  const transactions = result?.transactions ?? [];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Amex → YNAB Sync</h1>
        <p>Upload an Amex export and sync transactions to YNAB.</p>
      </header>

      <main className="app-main">
        <FileUpload
          onFile={handleFile}
          isLoading={isLoading}
          result={result}
          selectedFileName={selectedFile?.name ?? null}
          onClear={clear}
        />

        <SyncToYnab
          transactions={transactions}
          onSync={sync}
          disabled={isLoading}
        />

        <SyncStatus status={status} result={lastResult} onReset={reset} />
      </main>
    </div>
  );
}

export default App;
