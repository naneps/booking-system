param()

function New-Page($path, $title) {
  $dir  = Join-Path "pages" $path
  $file = Join-Path $dir "index.vue"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  if (Test-Path $file) { Write-Host "skip $file (exists)"; return }
@"
<script setup lang="ts">
definePageMeta({  })
</script>

<template>
  <UCard>
    <template #header>$title</template>
    <div class="text-gray-500">Coming soon…</div>
  </UCard>
</template>
"@ | Set-Content -NoNewline $file
  Write-Host "created $file"
}

# Dashboard
New-Item -ItemType Directory -Force -Path "pages" | Out-Null
if (-not (Test-Path "pages/index.vue")) {
@"
<script setup lang="ts">
definePageMeta({  })
</script>
<template>
  <UCard><template #header>Dashboard</template>Welcome.</UCard>
</template>
"@ | Set-Content -NoNewline "pages/index.vue"
}

# Master Data + children
New-Page "master-data"                       "Master Data"
New-Page "master-data/items"                 "Items"
New-Page "master-data/item-variants"         "Item Variants"
New-Page "master-data/units"                 "Units"
New-Page "master-data/categories"            "Categories"
New-Page "master-data/warehouses"            "Warehouses"
New-Page "master-data/suppliers"             "Suppliers"
New-Page "master-data/customers"             "Customers"
New-Page "master-data/price-lists"           "Price Lists"
New-Page "master-data/payment-terms"         "Payment Terms"

# Modules lain
New-Page "taksasi"                           "Taksasi (Ekspektasi)"
New-Page "planning-purchasing"               "Planning Purchasing"
New-Page "purchasing-stock"                  "Purchasing & Stok (Realisasi)"
New-Page "sales"                             "Sales"
New-Page "reporting"                         "Reporting"
New-Page "report-visit"                      "Report Visit"
New-Page "distribusi"                        "Distribusi"

# 403 page
if (-not (Test-Path "pages/403.vue")) {
@"
<template>
  <UAlert color="red" title="Akses ditolak" description="Peran kamu tidak memiliki akses ke halaman ini." />
</template>
"@ | Set-Content -NoNewline "pages/403.vue"
}

Write-Host "✅ Scaffold selesai."
