import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <main className="flex min-h-full items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 w-fit bg-black p-3">
          <Wordmark className="h-16 w-auto" />
        </div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted">If you were collecting flight media, ask the desk to show your QR again.</p>
      </div>
    </main>
  );
}
