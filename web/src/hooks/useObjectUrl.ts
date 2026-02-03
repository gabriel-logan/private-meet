import { useEffect, useRef } from "react";

export default function useObjectUrl() {
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Failed to revoke object URL:", error);
        }
      }
      objectUrlsRef.current = [];
    };
  }, []);

  return { objectUrlsRef };
}
