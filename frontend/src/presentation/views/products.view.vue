<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useCases } from "@/application/use-cases";
import { useAuthStore } from "../stores/auth.store";
import Button from "../components/ui/button.vue";
import Input from "../components/ui/input.vue";
import Card from "../components/ui/card.vue";
import Modal from "../components/ui/modal.vue";
import { formatIDR } from "../lib/utils";
import { toast } from "../lib/toast";
import { Search, Plus, Trash2, Pencil, PackagePlus } from "lucide-vue-next";

const auth = useAuthStore();
const qc = useQueryClient();
const page = ref(1);
const search = ref("");
const sortBy = ref("productName");
const sortOrder = ref<"ASC" | "DESC">("ASC");

const query = useQuery({
  queryKey: ["products", page, search, sortBy, sortOrder],
  queryFn: async () =>
    await useCases.listProducts({
      page: page.value,
      limit: 10,
      search: search.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
    }),
});

const items = computed(() => query.data.value?.data || []);
const meta = computed(() => query.data.value?.meta);

// Create / Edit modal
const showForm = ref(false);
const editing = ref<any>(null);
const form = ref({
  product_code: "",
  product_name: "",
  stock: 0,
  price: "",
  low_stock_threshold: 5,
});

function openCreate() {
  editing.value = null;
  form.value = {
    product_code: "",
    product_name: "",
    stock: 0,
    price: "",
    low_stock_threshold: 5,
  };
  showForm.value = true;
}
function openEdit(p: any) {
  editing.value = p;
  form.value = {
    product_code: p.product_code,
    product_name: p.product_name,
    stock: p.stock,
    price: p.price,
    low_stock_threshold: p.low_stock_threshold,
  };
  showForm.value = true;
}

const saveMutation = useMutation({
  mutationFn: async () => {
    if (editing.value) {
      return useCases.updateProduct(editing.value.id, {
        product_code: form.value.product_code,
        product_name: form.value.product_name,
        price: form.value.price,
        low_stock_threshold: form.value.low_stock_threshold,
      });
    }
    return useCases.createProduct(form.value);
  },
  onSuccess: (r) => {
    toast.success(r.message || "Saved");
    showForm.value = false;
    qc.invalidateQueries({ queryKey: ["products"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => useCases.deleteProduct(id),
  onSuccess: () => {
    toast.success("Product deleted");
    qc.invalidateQueries({ queryKey: ["products"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});

// Stock adjust modal
const adjustFor = ref<any>(null);
const adjustForm = ref({ quantity_change: 0, note: "" });
const adjustMutation = useMutation({
  mutationFn: () =>
    useCases.adjustStock(
      adjustFor.value.id,
      Number(adjustForm.value.quantity_change),
      adjustForm.value.note,
    ),
  onSuccess: () => {
    toast.success("Stock adjusted");
    adjustFor.value = null;
    qc.invalidateQueries({ queryKey: ["products"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});

function toggleSort(field: string) {
  if (sortBy.value === field)
    sortOrder.value = sortOrder.value === "ASC" ? "DESC" : "ASC";
  else {
    sortBy.value = field;
    sortOrder.value = "ASC";
  }
}

function confirmDelete(p: any) {
  if (window.confirm(`Delete product "${p.product_name}"?`))
    deleteMutation.mutate(p.id);
}
</script>

<template>
  <div>
    <div class="flex items-end justify-between mb-8">
      <div>
        <div
          class="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1"
        >
          Catalog
        </div>
        <h1 class="font-display text-4xl font-semibold tracking-tight">
          Products
        </h1>
      </div>
      <Button
        v-if="auth.hasPermission('products.create')"
        variant="accent"
        @click="openCreate"
        data-testid="create-product-btn"
      >
        <Plus class="w-4 h-4" /> New product
      </Button>
    </div>

    <Card class="p-4 mb-4">
      <div class="relative">
        <Search
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="search"
          placeholder="Search by name or code…"
          class="pl-9"
          data-testid="products-search"
        />
      </div>
    </Card>

    <Card>
      <div class="overflow-x-auto">
        <table class="w-full text-sm" data-testid="products-table">
          <thead
            class="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"
          >
            <tr>
              <th
                class="text-left p-3 cursor-pointer"
                @click="toggleSort('productCode')"
              >
                Code
              </th>
              <th
                class="text-left p-3 cursor-pointer"
                @click="toggleSort('productName')"
              >
                Name
              </th>
              <th
                class="text-right p-3 cursor-pointer"
                @click="toggleSort('stock')"
              >
                Stock
              </th>
              <th
                class="text-right p-3 cursor-pointer"
                @click="toggleSort('price')"
              >
                Price
              </th>
              <th class="text-right p-3">Low Threshold</th>
              <th class="text-right p-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="query.isLoading.value">
              <td colspan="6" class="p-8 text-center text-muted-foreground">
                Loading…
              </td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="6" class="p-8 text-center text-muted-foreground">
                No products found.
              </td>
            </tr>
            <tr
              v-for="p in items"
              :key="p.id"
              class="border-t border-border hover:bg-muted/40"
              :data-testid="`product-row-${p.id}`"
            >
              <td class="p-3 font-mono text-xs">{{ p.product_code }}</td>
              <td class="p-3 font-medium">{{ p.product_name }}</td>
              <td class="p-3 text-right">
                <span
                  :class="[
                    'tabular-nums',
                    p.stock <= p.low_stock_threshold
                      ? 'text-rose-600 font-semibold'
                      : '',
                  ]"
                  >{{ p.stock }}</span
                >
              </td>
              <td class="p-3 text-right tabular-nums">
                {{ formatIDR(p.price) }}
              </td>
              <td class="p-3 text-right tabular-nums text-muted-foreground">
                {{ p.low_stock_threshold }}
              </td>
              <td class="p-3 text-right">
                <div class="inline-flex gap-1">
                  <Button
                    v-if="auth.hasPermission('stock.adjust')"
                    variant="ghost"
                    size="icon"
                    @click="
                      adjustFor = p;
                      adjustForm = { quantity_change: 0, note: '' };
                    "
                    :data-testid="`adjust-stock-${p.id}`"
                    title="Adjust stock"
                  >
                    <PackagePlus class="w-4 h-4" />
                  </Button>
                  <Button
                    v-if="auth.hasPermission('products.update')"
                    variant="ghost"
                    size="icon"
                    @click="openEdit(p)"
                    :data-testid="`edit-product-${p.id}`"
                    title="Edit"
                  >
                    <Pencil class="w-4 h-4" />
                  </Button>
                  <Button
                    v-if="auth.hasPermission('products.delete')"
                    variant="ghost"
                    size="icon"
                    @click="confirmDelete(p)"
                    :data-testid="`delete-product-${p.id}`"
                    title="Delete"
                  >
                    <Trash2 class="w-4 h-4 text-destructive" />
                  </Button>
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
          Page {{ meta.page }} of {{ meta.total_pages }} ·
          {{ meta.total }} items
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

    <!-- Create / Edit modal -->
    <Modal
      v-if="showForm"
      :title="editing ? 'Edit product' : 'New product'"
      @close="showForm = false"
    >
      <form class="space-y-4" @submit.prevent="saveMutation.mutate()">
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Product code</label
          >
          <Input
            v-model="form.product_code"
            required
            :disabled="!!editing"
            class="mt-1.5"
            data-testid="form-product-code"
          />
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Product name</label
          >
          <Input
            v-model="form.product_name"
            required
            class="mt-1.5"
            data-testid="form-product-name"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Stock</label
            >
            <Input
              v-model="form.stock"
              type="number"
              min="0"
              class="mt-1.5"
              :disabled="!!editing"
              data-testid="form-product-stock"
            />
            <p v-if="editing" class="text-[11px] text-muted-foreground mt-1">
              Use Stock adjust to change stock.
            </p>
          </div>
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Price</label
            >
            <Input
              v-model="form.price"
              required
              class="mt-1.5"
              data-testid="form-product-price"
            />
          </div>
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Low stock threshold</label
          >
          <Input
            v-model="form.low_stock_threshold"
            type="number"
            min="0"
            class="mt-1.5"
            data-testid="form-product-threshold"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" @click="showForm = false"
            >Cancel</Button
          >
          <Button
            type="submit"
            variant="accent"
            :loading="saveMutation.isPending.value"
            data-testid="form-product-submit"
            >Save</Button
          >
        </div>
      </form>
    </Modal>

    <!-- Adjust Stock modal -->
    <Modal
      v-if="adjustFor"
      :title="`Adjust stock — ${adjustFor.product_name}`"
      @close="adjustFor = null"
    >
      <div class="text-xs text-muted-foreground mb-3">
        Current stock: <strong>{{ adjustFor.stock }}</strong>
      </div>
      <form class="space-y-4" @submit.prevent="adjustMutation.mutate()">
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Quantity change (negative to remove)</label
          >
          <Input
            v-model="adjustForm.quantity_change"
            type="number"
            required
            class="mt-1.5"
            data-testid="adjust-quantity-input"
          />
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Note</label
          >
          <Input
            v-model="adjustForm.note"
            required
            class="mt-1.5"
            data-testid="adjust-note-input"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" @click="adjustFor = null"
            >Cancel</Button
          >
          <Button
            type="submit"
            variant="accent"
            :loading="adjustMutation.isPending.value"
            data-testid="adjust-submit-btn"
            >Apply</Button
          >
        </div>
      </form>
    </Modal>
  </div>
</template>
