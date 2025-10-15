// src/components/AnalysisSummary.tsx
import React from "react";

interface AnalysisSummaryProps {
  summary: string;
}

export function AnalysisSummary({ summary }: AnalysisSummaryProps) {
  return (
    <section className="p-4 bg-gray-50 border rounded mt-4">
      <h2 className="text-lg font-semibold mb-2">Summary</h2>
      <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
    </section>
  );
}
