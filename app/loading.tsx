export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    </div>
  );
}
