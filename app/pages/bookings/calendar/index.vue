<script setup lang="ts">
// Types
interface Booking {
  id: number
  customer_name: string
  table_name: string
  floor: string
  date: string
  guests: number
  phone: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  notes?: string
}

// State
const currentDate = ref(new Date())
const viewMode = ref<'month' | 'week' | 'day'>('month')
const selectedBooking = ref<Booking | null>(null)
const searchQuery = ref('')
const filterStatus = ref('all')
const isModalOpen = ref(false)

// Generate dummy data
const generateDummyBookings = (): Booking[] => {
  const bookings: Booking[] = []
  const today = new Date()
  const tables = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'VIP 1', 'VIP 2']
  const floors = ['1st Floor', '2nd Floor', 'Rooftop']
  const customers = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Maria Garcia', 'David Wilson', 'Sarah Brown']
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + Math.floor(Math.random() * 14) - 7)
    const hour = Math.floor(Math.random() * 8) + 11
    const minute = Math.random() > 0.5 ? 0 : 30
    
    date.setHours(hour, minute, 0, 0)
    
    bookings.push({
      id: i + 1,
      customer_name: customers[Math.floor(Math.random() * customers.length)],
      table_name: tables[Math.floor(Math.random() * tables.length)],
      floor: floors[Math.floor(Math.random() * floors.length)],
      date: date.toISOString(),
      guests: Math.floor(Math.random() * 6) + 2,
      phone: `+62 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      status: ['confirmed', 'pending', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as any,
      notes: Math.random() > 0.7 ? 'Special occasion - Birthday' : ''
    })
  }
  
  return bookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

const bookings = ref<Booking[]>(generateDummyBookings())

// Helper functions
const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  return { daysInMonth, startingDayOfWeek, firstDay, lastDay }
}

const getBookingsForDate = (date: Date) => {
  return bookings.value.filter(booking => {
    const bookingDate = new Date(booking.date)
    return (
      bookingDate.getDate() === date.getDate() &&
      bookingDate.getMonth() === date.getMonth() &&
      bookingDate.getFullYear() === date.getFullYear() &&
      (filterStatus.value === 'all' || booking.status === filterStatus.value) &&
      (searchQuery.value === '' || 
        booking.customer_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        booking.table_name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  })
}

const getWeekDays = () => {
  const days: Date[] = []
  const startOfWeek = new Date(currentDate.value)
  startOfWeek.setDate(currentDate.value.getDate() - currentDate.value.getDay())
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    days.push(day)
  }
  return days
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const getStatusColor = (status: string) => {
  const colors = {
    confirmed: 'emerald',
    pending: 'amber',
    completed: 'blue',
    cancelled: 'rose'
  }
  return colors[status as keyof typeof colors] || 'gray'
}

const navigateDate = (direction: number) => {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    newDate.setMonth(currentDate.value.getMonth() + direction)
  } else if (viewMode.value === 'week') {
    newDate.setDate(currentDate.value.getDate() + (direction * 7))
  } else {
    newDate.setDate(currentDate.value.getDate() + direction)
  }
  currentDate.value = newDate
}

const openBookingDetail = (booking: Booking) => {
  selectedBooking.value = booking
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedBooking.value = null
}

// Computed
const currentMonthYear = computed(() => {
  if (viewMode.value === 'day') {
    return currentDate.value.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  return currentDate.value.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})

const stats = computed(() => {
  const all = bookings.value
  return {
    total: all.length,
    confirmed: all.filter(b => b.status === 'confirmed').length,
    pending: all.filter(b => b.status === 'pending').length,
    completed: all.filter(b => b.status === 'completed').length
  }
})

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

// Render Month View
const monthViewDays = computed(() => {
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate.value)
  const days: any[] = []
  
  // Empty cells
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push({ isEmpty: true, key: `empty-${i}` })
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), day)
    const dayBookings = getBookingsForDate(date)
    const isToday = new Date().toDateString() === date.toDateString()
    
    days.push({
      day,
      date,
      bookings: dayBookings,
      isToday,
      key: `day-${day}`
    })
  }
  
  return days
})

// Render Week View
const weekViewData = computed(() => {
  const weekDays = getWeekDays()
  const hours = Array.from({ length: 12 }, (_, i) => i + 9)
  
  return {
    weekDays,
    hours,
    columns: weekDays.map(day => ({
      day,
      bookings: getBookingsForDate(day),
      isToday: new Date().toDateString() === day.toDateString()
    }))
  }
})

// Render Day View
const dayViewData = computed(() => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 9)
  const dayBookings = getBookingsForDate(currentDate.value)
  
  return { hours, bookings: dayBookings }
})
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        
        <!-- Header -->
        <UCard>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Table Booking Calendar</h1>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Manage your restaurant reservations</p>
            </div>
            
            <UButton icon="i-lucide-plus" size="lg" class="w-full sm:w-auto">
              New Booking
            </UButton>
          </div>
        </UCard>

        <!-- Controls -->
        <UCard>
          <div class="flex flex-col lg:flex-row gap-3">
            <!-- Search -->
            <div class="flex-1">
              <UInput
                v-model="searchQuery"
                icon="i-lucide-search"
                placeholder="Search by customer or table..."
                size="lg"
              />
            </div>

            <!-- Filter -->
            <USelectMenu
              v-model="filterStatus"
              :options="statusOptions"
              size="lg"
              class="w-full lg:w-48"
            >
              <template #leading>
                <Icon name="lucide:filter" class="w-4 h-4" />
              </template>
            </USelectMenu>

            <!-- View Mode -->
            <UButtonGroup size="lg" orientation="horizontal" class="w-full lg:w-auto">
              <UButton 
                :variant="viewMode === 'month' ? 'solid' : 'ghost'"
                @click="viewMode = 'month'"
                class="flex-1 lg:flex-none"
              >
                Month
              </UButton>
              <UButton 
                :variant="viewMode === 'week' ? 'solid' : 'ghost'"
                @click="viewMode = 'week'"
                class="flex-1 lg:flex-none"
              >
                Week
              </UButton>
              <UButton 
                :variant="viewMode === 'day' ? 'solid' : 'ghost'"
                @click="viewMode = 'day'"
                class="flex-1 lg:flex-none"
              >
                Day
              </UButton>
            </UButtonGroup>
          </div>
        </UCard>

        <!-- Navigation -->
        <UCard>
          <div class="flex items-center justify-between">
            <UButton
              icon="i-lucide-chevron-left"
              variant="ghost"
              @click="navigateDate(-1)"
            />
            
            <div class="flex items-center gap-2">
              <Icon name="lucide:calendar" class="w-4 sm:w-5 h-4 sm:h-5 text-gray-500 hidden sm:block" />
              <h2 class="text-sm sm:text-lg font-semibold text-center">{{ currentMonthYear }}</h2>
            </div>
            
            <UButton
              icon="i-lucide-chevron-right"
              variant="ghost"
              @click="navigateDate(1)"
            />
          </div>
        </UCard>

        <!-- Calendar Grid -->
        <UCard class="overflow-hidden">
          <!-- Month View -->
          <div v-if="viewMode === 'month'" class="w-full">
            <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 mb-px">
              <div
                v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
                :key="day"
                class="p-2 text-center text-xs sm:text-sm font-semibold bg-gray-50 dark:bg-gray-900"
              >
                <span class="hidden sm:inline">{{ day }}</span>
                <span class="sm:hidden">{{ day[0] }}</span>
              </div>
            </div>
            
            <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800">
              <div
                v-for="dayData in monthViewDays"
                :key="dayData.key"
                :class="[
                  'min-h-[80px] sm:min-h-[120px] p-1 sm:p-2',
                  dayData.isEmpty ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-950',
                  dayData.isToday && 'bg-blue-50 dark:bg-blue-950'
                ]"
              >
                <template v-if="!dayData.isEmpty">
                  <div 
                    :class="[
                      'text-xs sm:text-sm font-semibold mb-1',
                      dayData.isToday ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'
                    ]"
                  >
                    {{ dayData.day }}
                  </div>
                  
                  <div class="space-y-1 overflow-y-auto max-h-[50px] sm:max-h-[90px]">
                    <div
                      v-for="booking in dayData.bookings.slice(0, 2)"
                      :key="booking.id"
                      :class="[
                        'text-[10px] sm:text-xs p-1 rounded cursor-pointer hover:shadow-md transition-shadow',
                        `bg-${getStatusColor(booking.status)}-100 dark:bg-${getStatusColor(booking.status)}-950`,
                        `text-${getStatusColor(booking.status)}-800 dark:text-${getStatusColor(booking.status)}-200`,
                        `border border-${getStatusColor(booking.status)}-300 dark:border-${getStatusColor(booking.status)}-800`
                      ]"
                      @click="openBookingDetail(booking)"
                    >
                      <div class="font-medium truncate">{{ formatTime(booking.date) }}</div>
                      <div class="truncate hidden sm:block">{{ booking.customer_name }}</div>
                    </div>
                    
                    <div v-if="dayData.bookings.length > 2" class="text-[10px] text-gray-500 font-medium">
                      +{{ dayData.bookings.length - 2 }} more
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Week View -->
          <div v-if="viewMode === 'week'" class="overflow-x-auto">
            <div class="flex min-w-[600px]">
              <!-- Time column -->
              <div class="w-16 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
                <div class="h-12 border-b border-gray-200 dark:border-gray-800"></div>
                <div
                  v-for="hour in weekViewData.hours"
                  :key="hour"
                  class="h-16 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 p-1"
                >
                  {{ hour > 12 ? hour - 12 : hour }}:00
                </div>
              </div>
              
              <!-- Days columns -->
              <div
                v-for="(col, idx) in weekViewData.columns"
                :key="idx"
                class="flex-1 min-w-[100px] border-r border-gray-200 dark:border-gray-800 last:border-r-0"
              >
                <div 
                  :class="[
                    'h-12 border-b border-gray-200 dark:border-gray-800 text-center p-2',
                    col.isToday ? 'bg-blue-100 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-900'
                  ]"
                >
                  <div class="text-xs text-gray-500">
                    {{ col.day.toLocaleDateString('en-US', { weekday: 'short' }) }}
                  </div>
                  <div :class="['text-sm font-semibold', col.isToday && 'text-blue-600']">
                    {{ col.day.getDate() }}
                  </div>
                </div>
                
                <div class="relative">
                  <div
                    v-for="hour in weekViewData.hours"
                    :key="hour"
                    class="h-16 border-b border-gray-100 dark:border-gray-900"
                  ></div>
                  
                  <div
                    v-for="booking in col.bookings"
                    :key="booking.id"
                    :class="[
                      'absolute left-1 right-1 p-1 cursor-pointer text-xs rounded',
                      `bg-${getStatusColor(booking.status)}-100 dark:bg-${getStatusColor(booking.status)}-950`,
                      `text-${getStatusColor(booking.status)}-800 dark:text-${getStatusColor(booking.status)}-200`,
                      `border border-${getStatusColor(booking.status)}-300 dark:border-${getStatusColor(booking.status)}-800`
                    ]"
                    :style="{
                      top: `${((new Date(booking.date).getHours() - 9) * 64) + (new Date(booking.date).getMinutes() / 60 * 64)}px`,
                      height: '60px'
                    }"
                    @click="openBookingDetail(booking)"
                  >
                    <div class="font-semibold text-[10px]">{{ formatTime(booking.date) }}</div>
                    <div class="truncate text-[10px]">{{ booking.customer_name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Day View -->
          <div v-if="viewMode === 'day'" class="max-h-[500px] overflow-y-auto">
            <div class="flex">
              <div class="w-16 sm:w-20 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
                <div
                  v-for="hour in dayViewData.hours"
                  :key="hour"
                  class="h-20 border-b border-gray-200 dark:border-gray-800 text-xs sm:text-sm text-gray-600 p-2"
                >
                  {{ hour > 12 ? hour - 12 : hour }}:00
                </div>
              </div>
              
              <div class="flex-1 relative">
                <div
                  v-for="hour in dayViewData.hours"
                  :key="hour"
                  class="h-20 border-b border-gray-100 dark:border-gray-900"
                ></div>
                
                <div
                  v-for="booking in dayViewData.bookings"
                  :key="booking.id"
                  :class="[
                    'absolute left-2 right-2 p-2 sm:p-3 cursor-pointer hover:shadow-lg transition-shadow rounded-lg',
                    `bg-${getStatusColor(booking.status)}-100 dark:bg-${getStatusColor(booking.status)}-950`,
                    `border border-${getStatusColor(booking.status)}-300 dark:border-${getStatusColor(booking.status)}-800`
                  ]"
                  :style="{
                    top: `${((new Date(booking.date).getHours() - 9) * 80) + (new Date(booking.date).getMinutes() / 60 * 80)}px`,
                    minHeight: '70px'
                  }"
                  @click="openBookingDetail(booking)"
                >
                  <div class="flex justify-between items-start mb-1">
                    <div class="font-bold text-xs sm:text-sm">{{ formatTime(booking.date) }}</div>
                    <UBadge :color="getStatusColor(booking.status)" size="xs">
                      {{ booking.status }}
                    </UBadge>
                  </div>
                  <div class="font-semibold text-sm">{{ booking.customer_name }}</div>
                  <div class="text-xs flex items-center gap-1 mt-1">
                    <Icon name="lucide:map-pin" class="w-3 h-3" />
                    {{ booking.table_name }}
                  </div>
                  <div class="text-xs flex items-center gap-1">
                    <Icon name="lucide:users" class="w-3 h-3" />
                    {{ booking.guests }} guests
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pb-4">
          <UCard>
            <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Total Bookings</div>
            <div class="text-xl sm:text-2xl font-bold text-blue-600">{{ stats.total }}</div>
          </UCard>
          <UCard>
            <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Confirmed</div>
            <div class="text-xl sm:text-2xl font-bold text-emerald-600">{{ stats.confirmed }}</div>
          </UCard>
          <UCard>
            <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Pending</div>
            <div class="text-xl sm:text-2xl font-bold text-amber-600">{{ stats.pending }}</div>
          </UCard>
          <UCard>
            <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Completed</div>
            <div class="text-xl sm:text-2xl font-bold text-blue-600">{{ stats.completed }}</div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Booking Detail Modal - FIXED -->
    <UModal v-model:open="isModalOpen">
     <template #default>
         <UCard v-if="selectedBooking">
        <template #header>
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-bold">Booking Details</h3>
              <p class="text-sm text-gray-500 mt-1">ID: #{{ selectedBooking.id }}</p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="gray"
              size="sm"
              @click="closeModal"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UBadge :color="getStatusColor(selectedBooking.status)" size="lg" variant="soft">
            {{ selectedBooking.status.toUpperCase() }}
          </UBadge>
          
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</label>
            <p class="text-lg font-semibold mt-1">{{ selectedBooking.customer_name }}</p>
          </div>
          
          <div class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
            <Icon name="lucide:clock" class="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div class="text-sm">
              {{ new Date(selectedBooking.date).toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) }}
            </div>
          </div>
          
          <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Icon name="lucide:map-pin" class="w-4 h-4 flex-shrink-0" />
            <span class="text-sm">{{ selectedBooking.table_name }} - {{ selectedBooking.floor }}</span>
          </div>
          
          <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Icon name="lucide:users" class="w-4 h-4 flex-shrink-0" />
            <span class="text-sm">{{ selectedBooking.guests }} guests</span>
          </div>
          
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</label>
            <p class="font-medium mt-1">{{ selectedBooking.phone }}</p>
          </div>
          
          <div v-if="selectedBooking.notes">
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</label>
            <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">{{ selectedBooking.notes }}</p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col sm:flex-row gap-2">
            <UButton block color="primary" variant="solid">
              <Icon name="lucide:edit" class="w-4 h-4 mr-1" />
              Edit Booking
            </UButton>
            <UButton block color="red" variant="soft">
              <Icon name="lucide:x-circle" class="w-4 h-4 mr-1" />
              Cancel Booking
            </UButton>
          </div>
        </template>
      </UCard>
     </template>
    </UModal>
  </div>
</template>