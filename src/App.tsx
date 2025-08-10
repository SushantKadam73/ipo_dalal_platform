import { Toaster } from "sonner";
import { IpoDashboard } from "./IpoDashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-blue-600">IPO Dalal</h2>
      </header>
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <IpoDashboard />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
