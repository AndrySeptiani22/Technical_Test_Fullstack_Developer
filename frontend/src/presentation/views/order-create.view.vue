<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useRouter } from "vue-router";
import { useCases } from "@/application/use-cases";
import Card from "../components/ui/card.vue";
import Input from "../components/ui/input.vue";
import Button from "../components/ui/button.vue";
import { formatIDR } from "../lib/utils";
import { toast } from "../lib/toast";
import { Trash2, Plus } from "lucide-vue-next";

const router = useRouter();
const qc = useQueryClient();
const customerId = ref("");
const items = ref<{ product_id: string; quantity: number }[]>([]);

const customers = useQuery({
  queryKey: ["customers-all"],
  queryFn: async () =>
    (await useCases.listCustomers({ page: 1, limit: 100 })).data || [],
});
const products = useQuery({
  queryKey: ["products-all"],
  queryFn: async () =>
    (await useCases.listProducts({ page: 1, limit: 100 })).data || [],
});

function addItem() {
  items.value.push({ product_id: "", quantity: 1 });
}
function removeItem(i: number) {
  items.value.splice(i, 1);
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

const canSubmit = computed(() => {
  if (!customerId.value || items.value.length === 0) return false;
  for (const it of items.value) {
    if (!it.product_id || !it.quantity || it.quantity < 1) return false;
    if (it.quantity > stockOf(it.product_id)) return false;
  }
  return true;
});

const submit = useMutation({
  mutationFn: () =>
    useCases.createOrder({
      customer_id: customerId.value,
      items: items.value.map((i) => ({
        product_id: i.product_id,
        quantity: Number(i.quantity),
      })),
    }),
  onSuccess: (r) => {
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
          <select
            v-model="customerId"
            class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            data-testid="order-customer-select"
          >
            <option value="">Select a customer…</option>
            <option v-for="c in customers.data.value" :key="c.id" :value="c.id">
              {{ c.customer_name }} — {{ c.customer_address }}
            </option>
          </select>
        </Card>

        <Card class="p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold">Line items</div>
            <Button
              size="sm"
              variant="outline"
              @click="addItem"
              data-testid="add-line-item-btn"
              ><Plus class="w-4 h-4" /> Add item</Button
            >
          </div>

          <div
            v-if="items.length === 0"
            class="text-sm text-muted-foreground py-6 text-center"
          >
            No items yet. Add one to begin.
          </div>

          <div
            v-for="(it, i) in items"
            :key="i"
            class="grid grid-cols-12 gap-2 items-end py-2 border-b border-border last:border-b-0"
            :data-testid="`line-item-${i}`"
          >
            <div class="col-span-7">
              <label
                class="text-[10px] uppercase tracking-wider text-muted-foreground"
                >Product</label
              >
              <select
                v-model="it.product_id"
                class="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                :data-testid="`line-product-${i}`"
              >
                <option value="">Select…</option>
                <option
                  v-for="p in products.data.value"
                  :key="p.id"
                  :value="p.id"
                  :disabled="p.stock <= 0"
                >
                  {{ p.product_name }} — {{ formatIDR(p.price) }} (stock:
                  {{ p.stock }})
                </option>
              </select>
            </div>
            <div class="col-span-3">
              <label
                class="text-[10px] uppercase tracking-wider text-muted-foreground"
                >Qty</label
              >
              <Input
                v-model="it.quantity"
                type="number"
                min="1"
                :max="stockOf(it.product_id) || undefined"
                :data-testid="`line-quantity-${i}`"
                class="mt-1"
              />
              <p
                v-if="it.product_id && it.quantity > stockOf(it.product_id)"
                class="text-[11px] text-destructive mt-1"
              >
                Exceeds stock ({{ stockOf(it.product_id) }})
              </p>
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
          :disabled="!canSubmit"
          :loading="submit.isPending.value"
          @click="submit.mutate()"
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
  </div>
</template>
