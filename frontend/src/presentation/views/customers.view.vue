<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useCases } from "@/application/use-cases";
import { useAuthStore } from "../stores/auth.store";
import Button from "../components/ui/button.vue";
import Input from "../components/ui/input.vue";
import Card from "../components/ui/card.vue";
import Modal from "../components/ui/modal.vue";
import { toast } from "../lib/toast";
import { Plus, Pencil, Trash2, Search } from "lucide-vue-next";

const auth = useAuthStore();
const qc = useQueryClient();
const page = ref(1);
const search = ref("");

const query = useQuery({
  queryKey: ["customers", page, search],
  queryFn: async () =>
    await useCases.listCustomers({
      page: page.value,
      limit: 10,
      search: search.value,
    }),
});
const items = computed(() => query.data.value?.data || []);
const meta = computed(() => query.data.value?.meta);

const showForm = ref(false);
const editing = ref<any>(null);
const form = ref<any>({
  customer_name: "",
  customer_address: "",
  gender: "",
  birth_date: "",
  phone: "",
  email: "",
});

function openCreate() {
  editing.value = null;
  form.value = {
    customer_name: "",
    customer_address: "",
    gender: "",
    birth_date: "",
    phone: "",
    email: "",
  };
  showForm.value = true;
}
function openEdit(c: any) {
  editing.value = c;
  form.value = {
    ...c,
    gender: c.gender || "",
    birth_date: c.birth_date || "",
    phone: c.phone || "",
    email: c.email || "",
  };
  showForm.value = true;
}

const save = useMutation({
  mutationFn: async () => {
    const payload: any = { ...form.value };
    for (const k of Object.keys(payload))
      if (payload[k] === "") payload[k] = null;
    payload.customer_name = form.value.customer_name;
    payload.customer_address = form.value.customer_address;
    if (editing.value)
      return useCases.updateCustomer(editing.value.id, payload);
    return useCases.createCustomer(payload);
  },
  onSuccess: (r) => {
    toast.success(r.message || "Saved");
    showForm.value = false;
    qc.invalidateQueries({ queryKey: ["customers"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});

const del = useMutation({
  mutationFn: (id: string) => useCases.deleteCustomer(id),
  onSuccess: () => {
    toast.success("Customer deleted");
    qc.invalidateQueries({ queryKey: ["customers"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});
function confirmDelete(c: any) {
  if (window.confirm(`Delete ${c.customer_name}?`)) del.mutate(c.id);
}
</script>

<template>
  <div>
    <div class="flex items-end justify-between mb-8">
      <div>
        <div
          class="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1"
        >
          Directory
        </div>
        <h1 class="font-display text-4xl font-semibold tracking-tight">
          Customers
        </h1>
      </div>
      <Button
        v-if="auth.hasPermission('customers.create')"
        variant="accent"
        @click="openCreate"
        data-testid="create-customer-btn"
      >
        <Plus class="w-4 h-4" /> New customer
      </Button>
    </div>

    <Card class="p-4 mb-4">
      <div class="relative">
        <Search
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="search"
          placeholder="Search by name or email…"
          class="pl-9"
          data-testid="customers-search"
        />
      </div>
    </Card>

    <Card>
      <div class="overflow-x-auto">
        <table class="w-full text-sm" data-testid="customers-table">
          <thead
            class="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"
          >
            <tr>
              <th class="text-left p-3">Name</th>
              <th class="text-left p-3">Email</th>
              <th class="text-left p-3">Phone</th>
              <th class="text-left p-3">Address</th>
              <th class="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="query.isLoading.value">
              <td colspan="5" class="p-8 text-center text-muted-foreground">
                Loading…
              </td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="5" class="p-8 text-center text-muted-foreground">
                No customers.
              </td>
            </tr>
            <tr
              v-for="c in items"
              :key="c.id"
              class="border-t border-border hover:bg-muted/40"
              :data-testid="`customer-row-${c.id}`"
            >
              <td class="p-3 font-medium">{{ c.customer_name }}</td>
              <td class="p-3 text-muted-foreground">{{ c.email || "—" }}</td>
              <td class="p-3 font-mono text-xs">{{ c.phone || "—" }}</td>
              <td class="p-3 text-muted-foreground">
                {{ c.customer_address }}
              </td>
              <td class="p-3 text-right">
                <div class="inline-flex gap-1">
                  <Button
                    v-if="auth.hasPermission('customers.update')"
                    variant="ghost"
                    size="icon"
                    @click="openEdit(c)"
                    :data-testid="`edit-customer-${c.id}`"
                    ><Pencil class="w-4 h-4"
                  /></Button>
                  <Button
                    v-if="auth.hasPermission('customers.delete')"
                    variant="ghost"
                    size="icon"
                    @click="confirmDelete(c)"
                    :data-testid="`delete-customer-${c.id}`"
                    ><Trash2 class="w-4 h-4 text-destructive"
                  /></Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="meta"
        class="p-3 border-t border-border flex items-center justify-between text-sm"
      >
        <div class="text-muted-foreground">
          Page {{ meta.page }} of {{ meta.total_pages }}
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="page <= 1"
            @click="page--"
            >Prev</Button
          >
          <Button
            variant="outline"
            size="sm"
            :disabled="page >= (meta.total_pages || 1)"
            @click="page++"
            >Next</Button
          >
        </div>
      </div>
    </Card>

    <Modal
      v-if="showForm"
      :title="editing ? 'Edit customer' : 'New customer'"
      @close="showForm = false"
    >
      <form class="space-y-4" @submit.prevent="save.mutate()">
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Name</label
          >
          <Input
            v-model="form.customer_name"
            required
            class="mt-1.5"
            data-testid="form-customer-name"
          />
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Address</label
          >
          <Input
            v-model="form.customer_address"
            required
            class="mt-1.5"
            data-testid="form-customer-address"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Email</label
            >
            <Input
              v-model="form.email"
              type="email"
              class="mt-1.5"
              data-testid="form-customer-email"
            />
          </div>
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Phone</label
            >
            <Input
              v-model="form.phone"
              class="mt-1.5"
              data-testid="form-customer-phone"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Gender</label
            >
            <select
              v-model="form.gender"
              class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              data-testid="form-customer-gender"
            >
              <option value="">—</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Birth date</label
            >
            <Input
              v-model="form.birth_date"
              type="date"
              class="mt-1.5"
              data-testid="form-customer-birthdate"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" @click="showForm = false"
            >Cancel</Button
          >
          <Button
            type="submit"
            variant="accent"
            :loading="save.isPending.value"
            data-testid="form-customer-submit"
            >Save</Button
          >
        </div>
      </form>
    </Modal>
  </div>
</template>
