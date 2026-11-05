<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useCases } from "@/application/use-cases";
import { useAuthStore } from "../stores/auth.store";
import Card from "../components/ui/card.vue";
import Button from "../components/ui/button.vue";
import Input from "../components/ui/input.vue";
import Modal from "../components/ui/modal.vue";
import StatusBadge from "../components/ui/status-badge.vue";
import { formatIDR, formatDateTime } from "../lib/utils";
import { toast } from "../lib/toast";
import { canTransition, type OrderStatus } from "@/domain/entities";
import { ArrowLeft, FileText } from "lucide-vue-next";

const route = useRoute();
const auth = useAuthStore();
const qc = useQueryClient();
const id = computed(() => route.params.id as string);

const order = useQuery({
  queryKey: ["order", id],
  queryFn: async () => (await useCases.getOrder(id.value)).data,
});
const customer = useQuery({
  enabled: computed(() => !!order.data.value?.customer_id),
  queryKey: ["customer", computed(() => order.data.value?.customer_id)],
  queryFn: async () =>
    (await useCases.getCustomer(order.data.value!.customer_id)).data,
});
const products = useQuery({
  queryKey: ["products-all"],
  queryFn: async () =>
    (await useCases.listProducts({ page: 1, limit: 100 })).data || [],
});

function productName(pid: string) {
  return products.data.value?.find((p) => p.id === pid)?.product_name || pid;
}

const showCancel = ref(false);
const cancelReason = ref("");

function invalidate() {
  for (const key of [
    "order",
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
}

const pay = useMutation({
  mutationFn: () => useCases.payOrder(id.value),
  onSuccess: () => {
    toast.success("Marked PAID");
    invalidate();
  },
  onError: (e: any) => toast.error(e?.message),
});
const ship = useMutation({
  mutationFn: () => useCases.shipOrder(id.value),
  onSuccess: () => {
    toast.success("Marked SHIPPED");
    invalidate();
  },
  onError: (e: any) => toast.error(e?.message),
});
const complete = useMutation({
  mutationFn: () => useCases.completeOrder(id.value),
  onSuccess: () => {
    toast.success("Marked COMPLETED");
    invalidate();
  },
  onError: (e: any) => toast.error(e?.message),
});
const cancel = useMutation({
  mutationFn: () => useCases.cancelOrder(id.value, cancelReason.value),
  onSuccess: () => {
    toast.success("Order cancelled");
    showCancel.value = false;
    invalidate();
  },
  onError: (e: any) => toast.error(e?.message),
});

function can(to: OrderStatus) {
  const s = order.data.value?.status;
  return s ? canTransition(s, to) : false;
}

async function openInvoice() {
  try {
    const html = await useCases.getInvoice(id.value);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  } catch (e: any) {
    toast.error("Failed to load invoice");
  }
}
</script>

<template>
  <div v-if="order.data.value">
    <RouterLink
      to="/orders"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
    >
      <ArrowLeft class="w-4 h-4" /> Back to orders
    </RouterLink>

    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <div
          class="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1 font-mono"
        >
          {{ order.data.value.order_number }}
        </div>
        <div class="flex items-center gap-3">
          <h1 class="font-display text-3xl font-semibold tracking-tight">
            Order details
          </h1>
          <StatusBadge :status="order.data.value.status" />
        </div>
        <div class="text-sm text-muted-foreground mt-2">
          Placed {{ formatDateTime(order.data.value.order_date) }}
        </div>
      </div>

      <div class="flex flex-wrap gap-2" data-testid="order-actions">
        <Button
          v-if="auth.hasPermission('orders.pay') && can('PAID')"
          @click="pay.mutate()"
          :loading="pay.isPending.value"
          variant="default"
          data-testid="pay-order-btn"
          >Mark Paid</Button
        >
        <Button
          v-if="auth.hasPermission('orders.ship') && can('SHIPPED')"
          @click="ship.mutate()"
          :loading="ship.isPending.value"
          data-testid="ship-order-btn"
          >Ship</Button
        >
        <Button
          v-if="auth.hasPermission('orders.complete') && can('COMPLETED')"
          @click="complete.mutate()"
          :loading="complete.isPending.value"
          variant="accent"
          data-testid="complete-order-btn"
          >Complete</Button
        >
        <Button
          v-if="auth.hasPermission('orders.cancel') && can('CANCELLED')"
          @click="showCancel = true"
          variant="destructive"
          data-testid="cancel-order-btn"
          >Cancel</Button
        >
        <Button
          v-if="auth.hasPermission('orders.invoice')"
          variant="outline"
          @click="openInvoice"
          data-testid="invoice-btn"
          ><FileText class="w-4 h-4" /> Invoice</Button
        >
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <Card class="p-5">
          <div class="font-semibold mb-3">Items</div>
          <table class="w-full text-sm">
            <thead
              class="text-xs text-muted-foreground uppercase tracking-wider"
            >
              <tr>
                <th class="text-left py-2">Product</th>
                <th class="text-right py-2">Qty</th>
                <th class="text-right py-2">Unit</th>
                <th class="text-right py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="it in order.data.value.items"
                :key="it.id"
                class="border-t border-border"
              >
                <td class="py-3">{{ productName(it.product_id) }}</td>
                <td class="py-3 text-right tabular-nums">{{ it.quantity }}</td>
                <td class="py-3 text-right tabular-nums">
                  {{ formatIDR(it.unit_price) }}
                </td>
                <td class="py-3 text-right tabular-nums font-medium">
                  {{ formatIDR(it.subtotal) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-border">
                <td colspan="3" class="py-3 text-right text-muted-foreground">
                  Total
                </td>
                <td
                  class="py-3 text-right font-display text-xl font-semibold"
                  data-testid="order-total-amount"
                >
                  {{ formatIDR(order.data.value.total_amount) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <Card class="p-5">
          <div class="font-semibold mb-3">Status timeline</div>
          <ol class="relative border-l-2 border-border ml-2 space-y-5">
            <li
              v-for="(h, i) in order.data.value.history"
              :key="i"
              class="pl-5 relative"
            >
              <span
                class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-accent ring-4 ring-background"
              ></span>
              <div class="flex items-center gap-2">
                <span v-if="h.from_status" class="text-xs text-muted-foreground"
                  >{{ h.from_status }} →</span
                >
                <StatusBadge :status="h.to_status" />
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ formatDateTime(h.created_at)
                }}<span v-if="h.reason"> · {{ h.reason }}</span>
              </div>
            </li>
          </ol>
        </Card>
      </div>

      <Card class="p-5 h-fit">
        <div class="font-semibold mb-3">Customer</div>
        <div v-if="customer.data.value">
          <div class="font-medium">{{ customer.data.value.customer_name }}</div>
          <div class="text-sm text-muted-foreground">
            {{ customer.data.value.customer_address }}
          </div>
          <div class="text-sm text-muted-foreground mt-2">
            {{ customer.data.value.email || "—" }}
          </div>
          <div class="text-sm text-muted-foreground font-mono">
            {{ customer.data.value.phone || "—" }}
          </div>
        </div>

        <div class="mt-5 pt-5 border-t border-border">
          <div
            class="text-xs uppercase tracking-wider text-muted-foreground mb-1"
          >
            Order
          </div>
          <div class="text-sm">
            Status:
            <StatusBadge :status="order.data.value.status" class="ml-1" />
          </div>
          <div
            v-if="order.data.value.cancel_reason"
            class="text-sm mt-2 text-destructive"
          >
            Cancel: {{ order.data.value.cancel_reason }}
          </div>
        </div>
      </Card>
    </div>

    <Modal v-if="showCancel" title="Cancel order" @close="showCancel = false">
      <form class="space-y-4" @submit.prevent="cancel.mutate()">
        <p class="text-sm text-muted-foreground">
          Cancelling will restore stock for all items. Please provide a reason.
        </p>
        <Input
          v-model="cancelReason"
          placeholder="Reason for cancellation…"
          required
          data-testid="cancel-reason-input"
        />
        <div class="flex justify-end gap-2">
          <Button type="button" variant="ghost" @click="showCancel = false"
            >Back</Button
          >
          <Button
            type="submit"
            variant="destructive"
            :loading="cancel.isPending.value"
            data-testid="confirm-cancel-btn"
            >Confirm cancel</Button
          >
        </div>
      </form>
    </Modal>
  </div>
</template>
