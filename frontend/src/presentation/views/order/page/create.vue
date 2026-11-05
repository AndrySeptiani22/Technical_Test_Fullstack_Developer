<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useRouter } from "vue-router";
import {
  createOrder,
} from "@/application/use-cases/order.use-case";
import {
  listCustomers,
} from "@/application/use-cases/customer.use-case";
import {
  listProducts,
} from "@/application/use-cases/product.use-case";
import Card from "@/presentation/components/ui/card.vue";
import Input from "@/presentation/components/ui/input.vue";
import Button from "@/presentation/components/ui/button.vue";
import { formatIDR } from "@/presentation/lib/utils";
import { toast } from "@/presentation/lib/toast";
import { Trash2, Plus } from "lucide-vue-next";
import SearchableSelect from "@/presentation/components/ui/searchable-select.vue";
import ConfirmDialog from "@/presentation/components/ui/confirm-dialog.vue";
import {
  orderCreateFormSchema,
  type OrderCreateForm,
} from "@/application/validation/request-schemas";
import { fieldErrors } from "@/presentation/lib/form-validation";

const router = useRouter();
const qc = useQueryClient();
const customerId = ref("");
const items = ref<{ product_id: string; quantity: number }[]>([]);
const showCreateConfirm = ref(false);
const formErrors = ref<Record<string, string>>({});
const pendingOrder = ref<OrderCreateForm | null>(null);

const customers = useQuery({
  queryKey: ["customers-all"],
  queryFn: async () =>
    (await listCustomers({ page: 1, limit: 100 })).data || [],
});
const products = useQuery({
  queryKey: ["products-all"],
  queryFn: async () =>
    (await listProducts({ page: 1, limit: 100 })).data || [],
});

const customerOptions = computed(() =>
  (customers.data.value ?? []).map((customer) => ({
    value: customer.id,
    label: `${customer.customer_name} — ${customer.customer_address}`,
  })),
);
const productOptions = computed(() =>
  (products.data.value ?? []).map((product) => ({
    value: product.id,
    label: `${product.product_name} — ${formatIDR(product.price)} (stock: ${product.stock})`,
    disabled: product.stock <= 0,
  })),
);

function productOptionsForItem(index: number) {
  const selectedByOtherItem = new Set(
    items.value
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item) => item.product_id)
      .filter(Boolean),
  );
  return productOptions.value.map((option) => {
    const alreadyAdded = selectedByOtherItem.has(option.value);
    return {
      ...option,
      label: alreadyAdded ? `${option.label} — Already added` : option.label,
      disabled: option.disabled || alreadyAdded,
    };
  });
}

function addItem() {
  if (items.value.length >= 100) return;
  items.value.push({ product_id: "", quantity: 1 });
  formErrors.value = {};
}
function removeItem(i: number) {
  items.value.splice(i, 1);
  formErrors.value = {};
}

const total = computed(() => {
  let t = 0;
  for (const it of items.value) {
    const p = products.data.value?.find((x) => x.id === it.product_id);
    if (p) t += Number(p.price) * Number(it.quantity || 0);
  }
  return t;
});

function stockOf(pid: string) {
  return products.data.value?.find((p) => p.id === pid)?.stock ?? 0;
}

function requestCreate() {
  const result = orderCreateFormSchema.safeParse({
    customer_id: customerId.value,
    items: items.value,
  });
  if (!result.success) {
    formErrors.value = fieldErrors(result.error);
    return;
  }
  const stockErrors: Record<string, string> = {};
  result.data.items.forEach((item, index) => {
    if (item.quantity > stockOf(item.product_id)) {
      stockErrors[`items.${index}.quantity`] =
        `Quantity exceeds available stock (${stockOf(item.product_id)}).`;
    }
  });
  if (Object.keys(stockErrors).length > 0) {
    formErrors.value = stockErrors;
    return;
  }
  formErrors.value = {};
  pendingOrder.value = result.data;
  showCreateConfirm.value = true;
}

function confirmCreate() {
  if (pendingOrder.value) submit.mutate(pendingOrder.value);
}

const submit = useMutation({
  mutationFn: (payload: OrderCreateForm) => createOrder(payload),
  onSuccess: (r) => {
    showCreateConfirm.value = false;
    for (const key of [
      "orders",
      "dashboard-summary",
      "products",
      "products-all",
      "movements",
      "sales",
      "top-products",
    ]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
    toast.success("Order created");
    const id = r.data?.id;
    if (id) router.push(`/orders/${id}`);
    else router.push("/orders");
  },
  onError: (e: any) => toast.error(e?.message || "Failed to create order"),
});
</script>

<template>
  <div>
    <div class="mb-8">
      <div
        class="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1"
      >
        Create
      </div>
      <h1 class="font-display text-4xl font-semibold tracking-tight">
        New order
      </h1>
      <p class="text-sm text-muted-foreground mt-2">
        Pricing and totals are computed server-side on submit; an idempotency
        key is attached automatically.
      </p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <Card class="p-5">
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Customer</label
          >
          <SearchableSelect
            v-model="customerId"
            :options="customerOptions"
            placeholder="Select a customer…"
            accessible-label="Customer"
            data-testid="order-customer-select"
            @update:model-value="formErrors.customer_id = ''"
          />
          <p v-if="formErrors.customer_id" class="mt-1 text-xs text-destructive">
            {{ formErrors.customer_id }}
          </p>
        </Card>

        <Card class="p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold">Line items</div>
            <Button
              size="sm"
              variant="outline"
              @click="addItem"
              :disabled="items.length >= 100"
              data-testid="add-line-item-btn"
              ><Plus class="w-4 h-4" /> Add item</Button
            >
          </div>
          <p v-if="formErrors.items" class="mt-2 text-xs text-destructive">
            {{ formErrors.items }}
          </p>

          <div
            v-if="items.length === 0"
            class="text-sm text-muted-foreground py-6 text-center"
          >
            No items yet. Add one to begin.
          </div>

          <div
            v-if="items.length"
            class="grid grid-cols-12 gap-2 border-b border-border pb-2 text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            <div class="col-span-7">Product</div>
            <div class="col-span-3">Qty</div>
            <div class="col-span-2 text-right">Actions</div>
          </div>

          <div
            v-for="(it, i) in items"
            :key="i"
            class="grid grid-cols-12 gap-2 items-end py-2 border-b border-border last:border-b-0"
            :data-testid="`line-item-${i}`"
          >
            <div class="col-span-7">
              <SearchableSelect
                v-model="it.product_id"
                :options="productOptionsForItem(i)"
                placeholder="Select a product…"
                :accessible-label="`Product for line ${i + 1}`"
                :data-testid="`line-product-${i}`"
                @update:model-value="
                  formErrors.items = '';
                  formErrors[`items.${i}.product_id`] = ''
                "
              />
              <p
                v-if="formErrors[`items.${i}.product_id`]"
                class="mt-1 text-xs text-destructive"
              >
                {{ formErrors[`items.${i}.product_id`] }}
              </p>
            </div>
            <div class="col-span-3">
              <div class="group relative">
                <Input
                  v-model="it.quantity"
                  type="number"
                  :disabled="!it.product_id"
                  min="1"
                  step="1"
                  :max="it.product_id ? Math.min(stockOf(it.product_id), 2147483647) : 2147483647"
                  :aria-invalid="
                    !!formErrors[`items.${i}.quantity`] ||
                    (!!it.product_id && it.quantity > stockOf(it.product_id))
                  "
                  @update:model-value="
                    formErrors.items = '';
                    formErrors[`items.${i}.quantity`] = ''
                  "
                  :data-testid="`line-quantity-${i}`"
                  :aria-describedby="
                    it.product_id && it.quantity > stockOf(it.product_id)
                      ? `stock-warning-${i}`
                      : undefined
                  "
                  class="mt-1"
                  :class="
                    it.product_id && it.quantity > stockOf(it.product_id)
                      ? 'border-destructive text-destructive focus-visible:ring-destructive'
                      : ''
                  "
                />
                <p
                  v-if="formErrors[`items.${i}.quantity`]"
                  class="mt-1 text-xs text-destructive"
                >
                  {{ formErrors[`items.${i}.quantity`] }}
                </p>
                <div
                  v-if="it.product_id && it.quantity > stockOf(it.product_id)"
                  :id="`stock-warning-${i}`"
                  role="tooltip"
                  class="invisible absolute bottom-full right-0 z-20 mb-2 whitespace-nowrap rounded-md bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                >
                  Exceeds stock ({{ stockOf(it.product_id) }})
                </div>
              </div>
            </div>
            <div class="col-span-2 flex justify-end">
              <Button
                size="icon"
                variant="ghost"
                @click="removeItem(i)"
                :data-testid="`remove-line-${i}`"
                ><Trash2 class="w-4 h-4 text-destructive"
              /></Button>
            </div>
          </div>
        </Card>
      </div>

      <Card class="p-5 h-fit lg:sticky lg:top-6">
        <div class="font-semibold mb-4">Summary</div>
        <div class="flex justify-between text-sm py-1">
          <span class="text-muted-foreground">Items</span
          ><span>{{ items.length }}</span>
        </div>
        <div class="flex justify-between text-sm py-1">
          <span class="text-muted-foreground">Total qty</span
          ><span>{{
            items.reduce((s, i) => s + Number(i.quantity || 0), 0)
          }}</span>
        </div>
        <div class="border-t border-border my-3"></div>
        <div class="flex justify-between items-baseline">
          <span class="text-sm text-muted-foreground">Estimated total</span>
          <span
            class="font-display text-2xl font-semibold tracking-tight"
            data-testid="order-total"
            >{{ formatIDR(total) }}</span
          >
        </div>
        <Button
          variant="accent"
          size="lg"
          class="w-full mt-5"
          :disabled="submit.isPending.value"
          :loading="submit.isPending.value"
          @click="requestCreate"
          data-testid="submit-order-btn"
        >
          Create order
        </Button>
        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Final price is re-calculated by the API from current product data.
          Stock is validated transactionally.
        </p>
      </Card>
    </div>
    <ConfirmDialog
      v-if="showCreateConfirm"
      title="Confirm order"
      message="Are you sure you want to create this order?"
      confirm-label="Create order"
      :loading="submit.isPending.value"
      @cancel="showCreateConfirm = false"
      @confirm="confirmCreate"
    />
  </div>
</template>
