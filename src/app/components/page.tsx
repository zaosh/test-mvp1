"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState, EMPTY_ICONS } from "@/components/shared/EmptyState";

interface Component {
  id: string;
  name: string;
  type: string;
  version: string | null;
  serialNumber: string | null;
  description: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
}

export default function ComponentsPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();

  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 18;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");

  // Fetch all component types for filter dropdown
  const [componentTypes, setComponentTypes] = useState<string[]>([]);

  useEffect(() => {
    if (authStatus === "loading") return;
    {
      // Fetch all to get type list (no pagination)
      fetch("/api/components")
        .then((r) => r.json())
        .then((data: Component[]) => {
          setComponentTypes(Array.from(new Set(data.map((c) => c.type))));
        })
        .catch(() => {});
    }
  }, [authStatus, router]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterType]);

  // Fetch paginated components
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (searchQuery) params.set("search", searchQuery);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    setLoading(true);
    fetch(`/api/components?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !Array.isArray(data) && Array.isArray(data.data)) {
          setComponents(data.data);
          setTotal(data.total);
        } else {
          setComponents(Array.isArray(data) ? data : []);
          setTotal(Array.isArray(data) ? data.length : 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus, filterType, searchQuery, page]);

  const filteredComponents = components;

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8888a8] text-sm">Loading components...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-[#e8e8f0] tracking-tight">Components</h1>
        <p className="text-sm text-[#8888a8] mt-1">
          {filteredComponents.length} component
          {filteredComponents.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or serial number..."
          className="flex-1 bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
        >
          <option value="">All Types</option>
          {componentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filteredComponents.length === 0 && !loading ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <EmptyState
            icon={EMPTY_ICONS.component}
            title="No components found"
            description="Register components to track testing against hardware and software."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              onClick={() => router.push(`/components/${component.id}`)}
              className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 hover:border-[#555570] cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-[#e8e8f0] text-sm leading-tight">
                  {component.name}
                </h3>
                <StatusPill status={component.status} />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <TypePill type={component.type} />
              </div>

              <div className="space-y-1 mb-3">
                {component.version && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#555570]">Version</span>
                    <span className="font-mono-value text-xs text-[#8888a8]">
                      {component.version}
                    </span>
                  </div>
                )}
                {component.serialNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#555570]">S/N</span>
                    <span className="font-mono-value text-xs text-[#8888a8]">
                      {component.serialNumber}
                    </span>
                  </div>
                )}
              </div>

              {component.description && (
                <p className="text-xs text-[#555570] leading-relaxed line-clamp-2">
                  {component.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredComponents.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
