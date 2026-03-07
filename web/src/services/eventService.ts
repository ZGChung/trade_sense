import type { EventGroup, HistoricalEvent, StockCategory } from "../models/types";
import { getStockCategory, mockData } from "../models/mockData";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const EVENT_CACHE_KEY = "tradesense_event_groups_cache_v1";
const CACHE_SIZE = 50;

interface SupabaseEventRow {
  id: string;
  description: string;
  event_date: string;
  stock_symbol: string;
  stock_name: string;
  actual_performance: number | string;
  days_after_event: number;
}

interface SupabaseEventGroupRow {
  id: string;
  stock_symbol: string;
  stock_name: string;
  category: string | null;
  events: SupabaseEventRow[] | null;
}

function normalizeCategory(rawCategory: string | null, symbol: string): StockCategory {
  if (!rawCategory) {
    return getStockCategory(symbol);
  }

  const allowedCategories: StockCategory[] = ["科技", "金融", "消费", "能源", "医疗", "其他"];
  if (allowedCategories.includes(rawCategory as StockCategory)) {
    return rawCategory as StockCategory;
  }

  return getStockCategory(symbol);
}

function mapEventRowToEvent(event: SupabaseEventRow): HistoricalEvent {
  return {
    id: event.id,
    description: event.description,
    date: event.event_date,
    stockSymbol: event.stock_symbol,
    stockName: event.stock_name,
    actualPerformance:
      typeof event.actual_performance === "string"
        ? parseFloat(event.actual_performance)
        : event.actual_performance,
    daysAfterEvent: event.days_after_event,
  };
}

function mapEventGroupRow(group: SupabaseEventGroupRow): EventGroup {
  const events = (group.events ?? [])
    .map(mapEventRowToEvent)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    id: group.id,
    stockSymbol: group.stock_symbol,
    stockName: group.stock_name,
    category: normalizeCategory(group.category, group.stock_symbol),
    events,
  };
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function shuffleArray<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentIndex = result.length;
  let randomValue = seed;

  while (currentIndex !== 0) {
    randomValue = (randomValue * 1103515245 + 12345) & 0x7fffffff;
    const randomIndex = randomValue % currentIndex;
    currentIndex -= 1;
    [result[currentIndex], result[randomIndex]] = [result[randomIndex], result[currentIndex]];
  }

  return result;
}

function normalizeEventGroups(groups: EventGroup[]): EventGroup[] {
  return groups.map((group) => ({
    ...group,
    category: group.category ?? getStockCategory(group.stockSymbol),
    events: [...group.events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  }));
}

function saveEventCache(groups: EventGroup[]): void {
  try {
    const snapshot = groups.slice(0, CACHE_SIZE);
    localStorage.setItem(EVENT_CACHE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Failed to cache event groups:", error);
  }
}

function loadEventCache(): EventGroup[] {
  try {
    const cached = localStorage.getItem(EVENT_CACHE_KEY);
    if (!cached) {
      return [];
    }

    const parsed = JSON.parse(cached) as EventGroup[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeEventGroups(parsed);
  } catch (error) {
    console.warn("Failed to read event cache:", error);
    return [];
  }
}

function applyFilters(
  groups: EventGroup[],
  category: StockCategory | "全部" = "全部",
  search: string = ""
): EventGroup[] {
  let filtered = groups;

  if (category !== "全部") {
    filtered = filtered.filter((group) => (group.category ?? getStockCategory(group.stockSymbol)) === category);
  }

  const query = search.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(
      (group) =>
        group.stockSymbol.toLowerCase().includes(query) ||
        group.stockName.toLowerCase().includes(query)
    );
  }

  return filtered;
}

class EventService {
  private eventPool: EventGroup[] | null = null;

  private getFallbackPool(): EventGroup[] {
    return normalizeEventGroups([...mockData]);
  }

  private async fetchFromSupabase(ids?: string[]): Promise<EventGroup[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    let query = supabase
      .from("event_groups")
      .select(
        "id, stock_symbol, stock_name, category, events(id, description, event_date, stock_symbol, stock_name, actual_performance, days_after_event)"
      )
      .limit(500);

    if (ids && ids.length > 0) {
      query = query.in("id", ids);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as unknown as SupabaseEventGroupRow[];
    return rows
      .map(mapEventGroupRow)
      .filter((group) => group.events.length > 0);
  }

  private async ensureEventPool(forceRefresh = false): Promise<EventGroup[]> {
    if (this.eventPool && !forceRefresh) {
      return this.eventPool;
    }

    const cached = loadEventCache();
    if (!forceRefresh && cached.length > 0) {
      this.eventPool = cached;
    }

    if (!isSupabaseConfigured) {
      this.eventPool = this.eventPool && this.eventPool.length > 0 ? this.eventPool : this.getFallbackPool();
      return this.eventPool;
    }

    try {
      const cloudPool = await this.fetchFromSupabase();
      if (cloudPool.length > 0) {
        this.eventPool = cloudPool;
        saveEventCache(cloudPool);
        return cloudPool;
      }
    } catch (error) {
      console.warn("Failed to load events from Supabase, using local fallback:", error);
    }

    this.eventPool = this.eventPool && this.eventPool.length > 0 ? this.eventPool : this.getFallbackPool();
    return this.eventPool;
  }

  async fetchEventGroups(forceRefresh = false): Promise<EventGroup[]> {
    return this.ensureEventPool(forceRefresh);
  }

  async fetchEventGroupsByIds(ids: string[]): Promise<EventGroup[]> {
    if (ids.length === 0) {
      return [];
    }

    const pool = await this.ensureEventPool();
    const poolMap = new Map(pool.map((group) => [group.id, group]));

    const initial = ids
      .map((id) => poolMap.get(id))
      .filter((group): group is EventGroup => Boolean(group));

    const missingIds = ids.filter((id) => !poolMap.has(id));
    if (missingIds.length === 0 || !isSupabaseConfigured) {
      return initial;
    }

    try {
      const cloudGroups = await this.fetchFromSupabase(missingIds);
      if (cloudGroups.length > 0) {
        const mergedPool = [...pool, ...cloudGroups.filter((group) => !poolMap.has(group.id))];
        this.eventPool = mergedPool;
        saveEventCache(mergedPool);
      }

      const cloudMap = new Map(cloudGroups.map((group) => [group.id, group]));
      return ids
        .map((id) => poolMap.get(id) ?? cloudMap.get(id))
        .filter((group): group is EventGroup => Boolean(group));
    } catch (error) {
      console.warn("Failed to fetch event groups by ids:", error);
      return initial;
    }
  }

  async fetchEventGroupById(id: string): Promise<EventGroup | null> {
    const groups = await this.fetchEventGroupsByIds([id]);
    return groups[0] ?? null;
  }

  async fetchRandomEventGroup(
    category: StockCategory | "全部" = "全部",
    search: string = ""
  ): Promise<EventGroup> {
    const pool = await this.ensureEventPool();
    const filtered = applyFilters(pool, category, search);

    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)];
    }

    return pool[Math.floor(Math.random() * pool.length)] ?? this.getFallbackPool()[0];
  }

  async fetchDailyChallenge(date: string = getTodayDateString(), count = 10): Promise<EventGroup[]> {
    const pool = await this.ensureEventPool();
    const seed = stringToSeed(date);
    const shuffled = shuffleArray(pool, seed);

    return shuffled.slice(0, Math.min(count, shuffled.length)).map((group, index) => ({
      ...group,
      events: shuffleArray(group.events, seed + index),
    }));
  }
}

export const eventService = new EventService();
