"use client";

import React, { useState } from "react";

interface Result {
  prompt: string;
  mentioned: boolean;
  position: number | null;
  error?: string;
}

export default function Home(): React.ReactElement {
  const [prompt, setPrompt] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const runCheck = async () => {
    setError("");

    if (!prompt.trim() || !brand.trim()) {
      setError("Please enter both a prompt and a brand name.");
      return;
    }

    setLoading(true);

    try {
      // Use relative path for same-origin requests or the env variable
      const backend =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

      const res = await fetch(`${backend}/api/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, brand }),
      });

      const data = (await res.json()) as Partial<Result> & { error?: string };

      if (!res.ok) {
        setError(data.error ?? `Backend returned status ${res.status}`);
      }

      const item: Result = {
        prompt,
        mentioned: Boolean(data.mentioned),
        position: data.position ?? null,
        error: data.error,
      };

      setResults((prev) => [item, ...prev]);
      if (data.error) setError(data.error);
    } catch (err) {
      setError(
        (err as Error)?.message ??
          "Unable to connect to backend. Make sure it's running on port 3001."
      );
    } finally {
      setLoading(false);
    }
  };

  const escapeCSV = (value: string | number | boolean | null): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const downloadCSV = () => {
    const header = ["prompt", "mentioned", "position"].join(",") + "\n";
    const rows = results
      .map(
        (r) =>
          `${escapeCSV(r.prompt)},${escapeCSV(r.mentioned)},${escapeCSV(
            r.position
          )}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "results.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-200 p-6 flex items-start justify-center">
      <div className="w-full max-w-4xl">
        <header className="rounded-2xl bg-[#16161a] shadow-lg p-6 mb-6 border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
              GB
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Gemini Brand Mention Checker
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Check if a brand is mentioned inside a prompt using your backend
                + Gemini.
              </p>
            </div>
          </div>
        </header>

        <main className="rounded-2xl bg-[#16161a] p-6 shadow-lg border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Paste or type the prompt you want to check..."
                className="w-full min-h-[120px] resize-y border border-gray-700 rounded-lg px-4 py-3 bg-[#0f0f11] text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Brand name
              </label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Nike"
                className="w-full border border-gray-700 rounded-lg px-4 py-3 bg-[#0f0f11] text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="brand-name"
              />

              <button
                onClick={runCheck}
                disabled={loading}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Checking...
                  </>
                ) : (
                  "Run check"
                )}
              </button>

              <button
                onClick={() => {
                  setPrompt("");
                  setBrand("");
                }}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 border border-gray-700 text-gray-300 bg-[#0f0f11]"
              >
                Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-900/30 border border-red-700 p-3 text-red-400">
              {error}
            </div>
          )}

          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Results</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResults([])}
                  className="text-sm px-3 py-1 rounded-md border border-gray-700 bg-[#0f0f11] text-gray-300"
                  disabled={results.length === 0}
                >
                  Clear
                </button>

                <button
                  onClick={downloadCSV}
                  className="text-sm px-3 py-1 rounded-md bg-emerald-600 text-white"
                  disabled={results.length === 0}
                >
                  Download CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-gray-300">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="py-3 pr-4">Prompt</th>
                    <th className="py-3 pr-4">Mentioned</th>
                    <th className="py-3 pr-4">Position</th>
                    <th className="py-3 pr-4">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-gray-500"
                      >
                        No results yet — run a check.
                      </td>
                    </tr>
                  ) : (
                    results.map((r, idx) => (
                      <tr
                        key={idx}
                        className="align-top border-b border-gray-800 last:border-b-0"
                      >
                        <td className="py-4 pr-4 max-w-[45ch] truncate text-gray-200">
                          {r.prompt}
                        </td>
                        <td className="py-4 pr-4 text-gray-200">
                          {r.mentioned ? "Yes" : "No"}
                        </td>
                        <td className="py-4 pr-4 text-gray-200">
                          {r.position === null ? "-" : r.position}
                        </td>
                        <td className="py-4 pr-4 text-sm text-red-400">
                          {r.error ?? ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
