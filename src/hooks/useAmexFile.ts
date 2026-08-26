import { useState, useCallback } from "react";
import type { AmexParseResult } from "../types/amex";
import { parseAmexFile, readFileAsText } from "../services/amexFileService";

export function useAmexFile() {
  const [result, setResult] = useState<AmexParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setSelectedFile(file);
    setResult(null);
    try {
      const content = await readFileAsText(file);
      const parseResult = await parseAmexFile(file, content);
      setResult(parseResult);
    } catch (err) {
      setResult({
        transactions: [],
        errors: [err instanceof Error ? err.message : "Failed to read file"],
        sourceName: file.name,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setSelectedFile(null);
  }, []);

  return { result, isLoading, selectedFile, handleFile, clear };
}
