<script setup lang="ts">
import { ref } from "vue";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { useProductStore } from "@/presentation/stores/product.store";
import Button from "@/presentation/components/ui/button.vue";
import Input from "@/presentation/components/ui/input.vue";
import Card from "@/presentation/components/ui/card.vue";
import Modal from "@/presentation/components/ui/modal.vue";
import ConfirmDialog from "@/presentation/components/ui/confirm-dialog.vue";
import type { GridFilterField } from "@/presentation/components/ui/grid-filters.vue";
import ProductGrid from "./component/grid.vue";
import { toast } from "@/presentation/lib/toast";
import { Search, Plus } from "lucide-vue-next";
import {
  productCreateFormSchema,
  productUpdateFormSchema,
  stockAdjustmentFormSchema,
} from "@/application/validation/request-schemas";
import { fieldErrors } from "@/presentation/lib/form-validation";

const auth = useAuthStore();
const productStore = useProductStore();
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
} = storeToRefs(productStore);
const filterFields: GridFilterField[] = [
  { key: "product_code", label: "Code", kind: "text", sortBy: "productCode" },
  { key: "product_name", label: "Name", kind: "text", sortBy: "productName" },
  { key: "stock", label: "Stock", kind: "number", sortBy: "stock", align: "right" },
  { key: "price", label: "Price", kind: "number", sortBy: "price", align: "right" },
  { key: "low_stock_threshold", label: "Low threshold", kind: "number", align: "right" },
];

const showForm = ref(false);
const editing = ref<any>(null);
const showUpdateConfirm = ref(false);
const deleting = ref<any>(null);
const formErrors = ref<Record<string, string>>({});
const adjustErrors = ref<Record<string, string>>({});
const form = ref({
  product_code: "",
  product_name: "",
  stock: 0,
  price: "",
  low_stock_threshold: 5,
});

function openCreate() {
  editing.value = null;
  formErrors.value = {};
  showUpdateConfirm.value = false;
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
  formErrors.value = {};
  showUpdateConfirm.value = false;
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
      return productStore.updateProduct(editing.value.id, {
        product_code: form.value.product_code,
        product_name: form.value.product_name,
        price: form.value.price,
        low_stock_threshold: form.value.low_stock_threshold,
      });
    }
    return productStore.createProduct(form.value);
  },
  onSuccess: (r) => {
    toast.success(r.message || "Saved");
    showForm.value = false;
    showUpdateConfirm.value = false;
    qc.invalidateQueries({ queryKey: ["products"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});

function requestSave() {
  if (editing.value) {
    const result = productUpdateFormSchema.safeParse({
        product_code: form.value.product_code,
        product_name: form.value.product_name,
        price: form.value.price,
        low_stock_threshold: form.value.low_stock_threshold,
      });
    if (!result.success) {
      formErrors.value = fieldErrors(result.error);
      return;
    }
    formErrors.value = {};
    form.value.low_stock_threshold = Number(form.value.low_stock_threshold);
    showUpdateConfirm.value = true;
    return;
  }

  const result = productCreateFormSchema.safeParse(form.value);
  if (!result.success) {
    formErrors.value = fieldErrors(result.error);
    return;
  }
  formErrors.value = {};
  form.value.stock = result.data.stock;
  form.value.low_stock_threshold = result.data.low_stock_threshold;
  saveMutation.mutate();
}

const deleteMutation = useMutation({
  mutationFn: (id: string) => productStore.deleteProduct(id),
  onSuccess: () => {
    toast.success("Product deleted");
    deleting.value = null;
    qc.invalidateQueries({ queryKey: ["products"] });
  },
  onError: (e: any) => toast.error(e?.message || "Failed"),
});

const adjustFor = ref<any>(null);
const adjustForm = ref({ quantity_change: 0, note: "" });
const adjustMutation = useMutation({
  mutationFn: () =>
    productStore.adjustStock(
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

function confirmDelete(p: any) {
  deleting.value = p;
}

function deleteProduct() {
  if (deleting.value) deleteMutation.mutate(deleting.value.id);
}

function openAdjust(p: any) {
  adjustFor.value = p;
  adjustForm.value = { quantity_change: 0, note: "" };
  adjustErrors.value = {};
}

function requestAdjust() {
  const result = stockAdjustmentFormSchema.safeParse(adjustForm.value);
  if (!result.success) {
    adjustErrors.value = fieldErrors(result.error);
    return;
  }
  adjustErrors.value = {};
  adjustMutation.mutate();
}
</script>

<template>
  <div>
    <div class="mb-6">
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
    </div>

    <Card class="p-4 mb-4 flex items-center gap-3">
      <div class="relative min-w-0 flex-1">
        <Search
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="search"
          maxlength="200"
          placeholder="Search by name or code…"
          class="pl-9"
          data-testid="products-search"
        />
      </div>
      <Button
        v-if="auth.hasPermission('products.create')"
        variant="accent"
        class="shrink-0"
        @click="openCreate"
        data-testid="create-product-btn"
      >
        <Plus class="w-4 h-4" /> New product
      </Button>
    </Card>

    <ProductGrid
      :items="items"
      :meta="meta"
      :page="page"
      :page-size="pageSize"
      :loading="isLoading"
      :can-adjust="auth.hasPermission('stock.adjust')"
      :can-edit="auth.hasPermission('products.update')"
      :can-delete="auth.hasPermission('products.delete')"
      v-model:filters="filters"
      :filter-fields="filterFields"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      @sort="productStore.toggleSort"
      @page-change="page = $event"
      @page-size-change="
        pageSize = $event;
        page = 1;
      "
      @adjust="openAdjust"
      @edit="openEdit"
      @delete="confirmDelete"
      @update:filters="page = 1"
    />

    <!-- Create / Edit modal -->
    <Modal
      v-if="showForm"
      :title="editing ? 'Edit product' : 'New product'"
      @close="showForm = false"
    >
      <form class="space-y-4" novalidate @submit.prevent="requestSave">
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Product code</label
          >
          <Input
            v-model="form.product_code"
            required
            maxlength="50"
            :disabled="!!editing"
            :aria-invalid="!!formErrors.product_code"
            @update:model-value="formErrors.product_code = ''"
            class="mt-1.5"
            data-testid="form-product-code"
          />
          <p v-if="formErrors.product_code" class="mt-1 text-xs text-destructive">
            {{ formErrors.product_code }}
          </p>
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Product name</label
          >
          <Input
            v-model="form.product_name"
            required
            maxlength="200"
            :aria-invalid="!!formErrors.product_name"
            @update:model-value="formErrors.product_name = ''"
            class="mt-1.5"
            data-testid="form-product-name"
          />
          <p v-if="formErrors.product_name" class="mt-1 text-xs text-destructive">
            {{ formErrors.product_name }}
          </p>
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
              max="2147483647"
              step="1"
              :aria-invalid="!!formErrors.stock"
              @update:model-value="formErrors.stock = ''"
              class="mt-1.5"
              :disabled="!!editing"
              data-testid="form-product-stock"
            />
            <p v-if="formErrors.stock" class="mt-1 text-xs text-destructive">
              {{ formErrors.stock }}
            </p>
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
              inputmode="decimal"
              maxlength="13"
              :aria-invalid="!!formErrors.price"
              @update:model-value="formErrors.price = ''"
              class="mt-1.5"
              data-testid="form-product-price"
            />
            <p v-if="formErrors.price" class="mt-1 text-xs text-destructive">
              {{ formErrors.price }}
            </p>
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
            max="2147483647"
            step="1"
            :aria-invalid="!!formErrors.low_stock_threshold"
            @update:model-value="formErrors.low_stock_threshold = ''"
            class="mt-1.5"
            data-testid="form-product-threshold"
          />
          <p v-if="formErrors.low_stock_threshold" class="mt-1 text-xs text-destructive">
            {{ formErrors.low_stock_threshold }}
          </p>
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

    <ConfirmDialog
      v-if="showUpdateConfirm && editing"
      title="Confirm product update"
      :message="`Save changes to ${form.product_name}?`"
      confirm-label="Save changes"
      :loading="saveMutation.isPending.value"
      @cancel="showUpdateConfirm = false"
      @confirm="saveMutation.mutate()"
    />

    <ConfirmDialog
      v-if="deleting"
      title="Delete product"
      :message="`Delete product '${deleting.product_name}'? This action cannot be undone.`"
      confirm-label="Delete product"
      variant="destructive"
      :loading="deleteMutation.isPending.value"
      @cancel="deleting = null"
      @confirm="deleteProduct"
    />

    <!-- Adjust Stock modal -->
    <Modal
      v-if="adjustFor"
      :title="`Adjust stock — ${adjustFor.product_name}`"
      @close="adjustFor = null"
    >
      <div class="text-xs text-muted-foreground mb-3">
        Current stock: <strong>{{ adjustFor.stock }}</strong>
      </div>
      <form class="space-y-4" novalidate @submit.prevent="requestAdjust">
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Quantity change (negative to remove)</label
          >
          <Input
            v-model="adjustForm.quantity_change"
            type="number"
            required
            min="-2147483648"
            max="2147483647"
            step="1"
            :aria-invalid="!!adjustErrors.quantity_change"
            @update:model-value="adjustErrors.quantity_change = ''"
            class="mt-1.5"
            data-testid="adjust-quantity-input"
          />
          <p v-if="adjustErrors.quantity_change" class="mt-1 text-xs text-destructive">
            {{ adjustErrors.quantity_change }}
          </p>
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Note</label
          >
          <Input
            v-model="adjustForm.note"
            required
            maxlength="1000"
            :aria-invalid="!!adjustErrors.note"
            @update:model-value="adjustErrors.note = ''"
            class="mt-1.5"
            data-testid="adjust-note-input"
          />
          <p v-if="adjustErrors.note" class="mt-1 text-xs text-destructive">
            {{ adjustErrors.note }}
          </p>
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
