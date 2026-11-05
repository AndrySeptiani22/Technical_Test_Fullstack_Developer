<script setup lang="ts">
import { ref } from "vue";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { useCustomerStore } from "@/presentation/stores/customer.store";
import Button from "@/presentation/components/ui/button.vue";
import Input from "@/presentation/components/ui/input.vue";
import Card from "@/presentation/components/ui/card.vue";
import Modal from "@/presentation/components/ui/modal.vue";
import ConfirmDialog from "@/presentation/components/ui/confirm-dialog.vue";
import GridFilters, {
  type GridFilterField,
} from "@/presentation/components/ui/grid-filters.vue";
import GridPagination from "@/presentation/components/ui/grid-pagination.vue";
import { toast } from "@/presentation/lib/toast";
import { Plus, Pencil, Trash2, Search } from "lucide-vue-next";
import { customerFormSchema } from "@/application/validation/request-schemas";
import { fieldErrors } from "@/presentation/lib/form-validation";

const auth = useAuthStore();
const customerStore = useCustomerStore();
const qc = useQueryClient();
const {
  page,
  pageSize,
  search,
  sortBy,
  sortOrder,
  filters,
  items,
  meta,
  isLoading,
} = storeToRefs(customerStore);
const filterFields: GridFilterField[] = [
  { key: "customer_name", label: "Name", kind: "text", sortBy: "customerName" },
  { key: "email", label: "Email", kind: "text", sortBy: "email" },
  { key: "phone", label: "Phone", kind: "text" },
  { key: "customer_address", label: "Address", kind: "text" },
];

const showForm = ref(false);
const editing = ref<any>(null);
const showUpdateConfirm = ref(false);
const deleting = ref<any>(null);
const formErrors = ref<Record<string, string>>({});
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
  formErrors.value = {};
  showUpdateConfirm.value = false;
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
  formErrors.value = {};
  showUpdateConfirm.value = false;
  editing.value = c;
  form.value = {
    customer_name: c.customer_name,
    customer_address: c.customer_address,
    gender: c.gender || "",
    birth_date: c.birth_date || "",
    phone: c.phone || "",
    email: c.email || "",
  };
  showForm.value = true;
}

const save = useMutation({
  mutationFn: async () => {
    const result = customerFormSchema.safeParse(form.value);
    if (!result.success) throw new Error("Please correct the customer form.");
    const payload = {
      customer_name: result.data.customer_name,
      customer_address: result.data.customer_address,
      gender: result.data.gender || null,
      birth_date: result.data.birth_date || null,
      phone: result.data.phone || null,
      email: result.data.email || null,
    };
    if (editing.value)
      return customerStore.updateCustomer(editing.value.id, payload);
    return customerStore.createCustomer(payload);
  },
  onSuccess: (r) => {
    toast.success(r.message || "Saved");
    showForm.value = false;
    showUpdateConfirm.value = false;
    qc.invalidateQueries({ queryKey: ["customers"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});

function requestSave() {
  const result = customerFormSchema.safeParse(form.value);
  if (!result.success) {
    formErrors.value = fieldErrors(result.error);
    return;
  }
  formErrors.value = {};
  if (editing.value) {
    showUpdateConfirm.value = true;
    return;
  }
  save.mutate();
}

const del = useMutation({
  mutationFn: (id: string) => customerStore.deleteCustomer(id),
  onSuccess: () => {
    toast.success("Customer deleted");
    deleting.value = null;
    qc.invalidateQueries({ queryKey: ["customers"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});
function confirmDelete(c: any) {
  deleting.value = c;
}
function deleteCustomer() {
  if (deleting.value) del.mutate(deleting.value.id);
}
</script>

<template>
  <div>
    <div class="mb-6">
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
    </div>

    <Card class="p-4 mb-4 flex items-center gap-3">
      <div class="relative min-w-0 flex-1">
        <Search
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="search"
          maxlength="200"
          placeholder="Search by name or email…"
          class="pl-9"
          data-testid="customers-search"
        />
      </div>
      <Button
        v-if="auth.hasPermission('customers.create')"
        variant="accent"
        class="shrink-0"
        @click="openCreate"
        data-testid="create-customer-btn"
      >
        <Plus class="w-4 h-4" /> New customer
      </Button>
    </Card>

    <Card>
      <div class="max-h-[36rem] overflow-auto">
        <table class="w-full text-sm" data-testid="customers-table">
          <thead
            class="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wider text-muted-foreground"
          >
            <GridFilters
              v-model="filters"
              :fields="filterFields"
              action-column
              :sort-by="sortBy"
              :sort-order="sortOrder"
              @sort="customerStore.toggleSort"
              @update:model-value="page = 1"
            />
          </thead>
          <tbody>
            <tr v-if="isLoading">
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
                    title="Edit customer"
                    aria-label="Edit customer"
                    @click="openEdit(c)"
                    :data-testid="`edit-customer-${c.id}`"
                    ><Pencil class="w-4 h-4"
                  /></Button>
                  <Button
                    v-if="auth.hasPermission('customers.delete')"
                    variant="ghost"
                    size="icon"
                    title="Delete customer"
                    aria-label="Delete customer"
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
      <GridPagination
        v-if="meta"
        :meta="meta"
        :page="page"
        :page-size="pageSize"
        item-label="customers"
        @page-change="page = $event"
        @page-size-change="
          pageSize = $event;
          page = 1;
        "
      />
    </Card>

    <Modal
      v-if="showForm"
      :title="editing ? 'Edit customer' : 'New customer'"
      @close="showForm = false"
    >
      <form class="space-y-4" novalidate @submit.prevent="requestSave">
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Name</label
          >
          <Input
            v-model="form.customer_name"
            required
            maxlength="200"
            :aria-invalid="!!formErrors.customer_name"
            @update:model-value="formErrors.customer_name = ''"
            class="mt-1.5"
            data-testid="form-customer-name"
          />
          <p v-if="formErrors.customer_name" class="mt-1 text-xs text-destructive">
            {{ formErrors.customer_name }}
          </p>
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Address</label
          >
          <Input
            v-model="form.customer_address"
            required
            maxlength="500"
            :aria-invalid="!!formErrors.customer_address"
            @update:model-value="formErrors.customer_address = ''"
            class="mt-1.5"
            data-testid="form-customer-address"
          />
          <p v-if="formErrors.customer_address" class="mt-1 text-xs text-destructive">
            {{ formErrors.customer_address }}
          </p>
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
              maxlength="255"
              :aria-invalid="!!formErrors.email"
              @update:model-value="formErrors.email = ''"
              class="mt-1.5"
              data-testid="form-customer-email"
            />
            <p v-if="formErrors.email" class="mt-1 text-xs text-destructive">
              {{ formErrors.email }}
            </p>
          </div>
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Phone</label
            >
            <Input
              v-model="form.phone"
              maxlength="30"
              :aria-invalid="!!formErrors.phone"
              @update:model-value="formErrors.phone = ''"
              class="mt-1.5"
              data-testid="form-customer-phone"
            />
            <p v-if="formErrors.phone" class="mt-1 text-xs text-destructive">
              {{ formErrors.phone }}
            </p>
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
              :aria-invalid="!!formErrors.birth_date"
              @update:model-value="formErrors.birth_date = ''"
              class="mt-1.5"
              data-testid="form-customer-birthdate"
            />
            <p v-if="formErrors.birth_date" class="mt-1 text-xs text-destructive">
              {{ formErrors.birth_date }}
            </p>
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

    <ConfirmDialog
      v-if="showUpdateConfirm && editing"
      title="Confirm customer update"
      :message="`Save changes to ${form.customer_name}?`"
      confirm-label="Save changes"
      :loading="save.isPending.value"
      @cancel="showUpdateConfirm = false"
      @confirm="save.mutate()"
    />

    <ConfirmDialog
      v-if="deleting"
      title="Delete customer"
      :message="`Delete ${deleting.customer_name}? This action cannot be undone.`"
      confirm-label="Delete customer"
      variant="destructive"
      :loading="del.isPending.value"
      @cancel="deleting = null"
      @confirm="deleteCustomer"
    />
  </div>
</template>
