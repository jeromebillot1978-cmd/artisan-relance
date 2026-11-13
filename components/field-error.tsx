export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs font-medium text-destructive">{errors[0]}</p>;
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (message) {
    return (
      <div role="status" className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
        {message}
      </div>
    );
  }
  return null;
}
