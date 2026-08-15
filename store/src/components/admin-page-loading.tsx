function Bone({ className = "" }: { className?: string }) {
  return <div className={`admin-skeleton ${className}`} aria-hidden />;
}

function Status({ label }: { label: string }) {
  return (
    <span className="sr-only" role="status">
      {label}
    </span>
  );
}

function PageHeaderBones() {
  return (
    <>
      <Bone className="h-7 w-36" />
      <Bone className="mt-3 h-4 w-64 max-w-full" />
    </>
  );
}

function TableLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="admin-table-wrap mt-6">
      <div className="space-y-0 divide-y divide-[color:var(--admin-border)]">
        <div className="flex gap-4 px-4 py-3">
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-16" />
          <Bone className="h-3 w-24" />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-4 py-4">
            <div className="min-w-0 flex-1">
              <Bone className="h-4 w-48 max-w-full" />
              <Bone className="mt-2 h-3 w-28" />
            </div>
            <Bone className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminOverviewLoading() {
  return (
    <div aria-busy="true">
      <Status label="Loading overview" />
      <PageHeaderBones />
      <div className="admin-card admin-stats mt-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="admin-stat">
            <Bone className="h-3 w-14" />
            <Bone className="mt-3 h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <Bone className="h-4 w-28" />
          <TableLoading rows={5} />
        </div>
        <div>
          <Bone className="h-4 w-24" />
          <TableLoading rows={4} />
        </div>
      </div>
    </div>
  );
}

export function AdminTablePageLoading({ label }: { label: string }) {
  return (
    <div aria-busy="true">
      <Status label={label} />
      <PageHeaderBones />
      <TableLoading rows={8} />
    </div>
  );
}

export function AdminDetailLoading({ label }: { label: string }) {
  return (
    <div aria-busy="true">
      <Status label={label} />
      <Bone className="h-4 w-20" />
      <Bone className="mt-3 h-7 w-56 max-w-full" />
      <Bone className="mt-3 h-4 w-40" />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="admin-card space-y-4 p-6">
          <Bone className="h-4 w-24" />
          <Bone className="h-10 w-full" />
          <Bone className="h-10 w-full" />
          <Bone className="h-10 w-2/3" />
        </div>
        <div className="admin-card space-y-4 p-6">
          <Bone className="h-4 w-20" />
          <Bone className="h-12 w-full" />
          <Bone className="h-12 w-full" />
          <Bone className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function AdminInventoryLoading() {
  return (
    <div aria-busy="true">
      <Status label="Loading inventory" />
      <PageHeaderBones />
      <div className="mt-6 flex justify-end gap-2">
        <Bone className="h-9 w-28" />
        <Bone className="h-9 w-36" />
      </div>
      <div className="mt-8 space-y-8">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <Bone className="h-4 w-32" />
            <TableLoading rows={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminToolsLoading() {
  return (
    <div aria-busy="true">
      <Status label="Loading tools and services" />
      <PageHeaderBones />
      <TableLoading rows={5} />
    </div>
  );
}

export function AdminFormLoading({ label }: { label: string }) {
  return (
    <div aria-busy="true">
      <Status label={label} />
      <Bone className="h-4 w-20" />
      <Bone className="mt-3 h-7 w-48" />
      <Bone className="mt-3 h-4 w-72 max-w-full" />
      <div className="admin-card mt-8 space-y-4 p-6">
        <Bone className="h-10 w-full" />
        <Bone className="h-24 w-full" />
        <Bone className="h-16 w-full" />
        <Bone className="h-10 w-36" />
      </div>
    </div>
  );
}
