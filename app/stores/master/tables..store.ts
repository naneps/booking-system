// stores/table.ts
import { defineStore } from "pinia";
import type { Table } from "~/types/master";

export const useTableStore = defineStore("table-store", () => {
  const tables = ref<Table[]>([]);
  const totalItems = ref(0);
  const loading = ref(false); 
  const brancHId = useCookie('selected_branch_id', { path: '/' })

  // params: page, per_page, q, branch_id, floor_id, status
  async function fetchTables(params: {
    page: number;
    per_page: number;
    q?: string;
    floor_id?: number | null;
    status?: string | null;
  }) {
    loading.value = true;
    try {
      const response = await useApi<any>("/api/v1/tables", {
        query: {...params , branch_id: brancHId.value},
      });
      // response likely paginated
      tables.value = response.data ?? [];
      totalItems.value = response.meta?.total ?? 0;
    } catch (e) {
      tables.value = [];
      totalItems.value = 0;
    } finally {
      loading.value = false;
    }
  }

  async function createTable(payload: Partial<Table>) {
    const {data} = await useApi<{data: Table}>("/api/v1/tables", {
      method: "POST",
      body: {
        ...payload,
        branch_id: brancHId.value
      },
    });
    return data;
  }

  async function updateTable(id: number, payload: Partial<Table>) {
    const {data} = await useApi<{data: Table}>(`/api/v1/tables/${id}`, {
      method: "PUT",
      body: payload,
    });
    const idx = tables.value.findIndex((t) => t.id === id);
    if (idx !== -1) tables.value[idx] = data;
    return data;
  }

  async function deleteTable(id: number) {
    await useApi(`/api/v1/tables/${id}`, {method: "DELETE"});
  }

  // hold & release endpoints
  async function holdTable(id: number, owner?: string, ttl?: number) {
    const res = await useApi(`/api/v1/tables/${id}/hold`, {
      method: "POST",
      body: {owner, ttl},
    });
    // optionally refresh the item in list:
    await refreshSingle(id);
    return res;
  }

  async function releaseTable(id: number, owner?: string) {
    const res = await useApi(`/api/v1/tables/${id}/release`, {
      method: "POST",
      body: {owner},
    });
    await refreshSingle(id);
    return res;
  }

  // helper to refresh a single record (optimistic)
  async function refreshSingle(id: number) {
    try {
      const {data} = await useApi<{data: Table}>(`/api/v1/tables/${id}`);
      const idx = tables.value.findIndex((t) => t.id === id);
      if (idx !== -1) tables.value[idx] = data;
    } catch (e) {
      // ignore
    }
  }

  return {
    tables,
    totalItems,
    loading,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    holdTable,
    releaseTable,
    refreshSingle,
  };
});
