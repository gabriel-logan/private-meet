import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@react-native-vector-icons/feather";

import type { Locale } from "../../../shared/types";
import { resources } from "../constants";
import { useUserStore } from "../stores/userStore";

type AnyRecord = Record<string, unknown>;

function flattenStrings(obj: AnyRecord, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      out[nextKey] = value;
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flattenStrings(value as AnyRecord, nextKey));
    }
  }

  return out;
}

const enFlat = flattenStrings(resources.en.translation as AnyRecord);
const deFlat = flattenStrings(resources.de.translation as AnyRecord);
const jaFlat = flattenStrings(resources.ja.translation as AnyRecord);
const ptFlat = flattenStrings(resources.pt.translation as AnyRecord);
const zhFlat = flattenStrings(resources.zh.translation as AnyRecord);

const totalEnKeys = Object.keys(enFlat).length;

const lngCoveragePct = (lngFlat: AnyRecord) => {
  if (totalEnKeys === 0) {
    return 100;
  }

  let covered = 0;

  for (const key of Object.keys(enFlat)) {
    const v = lngFlat[key];

    if (typeof v === "string" && v.trim().length > 0) {
      covered++;
    }
  }

  return Math.round((covered / totalEnKeys) * 100);
};

export default function SelectLanguage() {
  const { i18n } = useTranslation();

  const { locale, setLocale } = useUserStore();

  const [open, setOpen] = useState(false);

  const scale = useRef(new Animated.Value(0.95)).current;

  const opacity = useRef(new Animated.Value(0)).current;

  const languages: {
    value: Locale;
    label: string;
    pct: number;
  }[] = [
    { value: "en", label: "English", pct: 100 },
    { value: "de", label: "Deutsch", pct: lngCoveragePct(deFlat) },
    { value: "ja", label: "日本語", pct: lngCoveragePct(jaFlat) },
    { value: "pt", label: "Português", pct: lngCoveragePct(ptFlat) },
    { value: "zh", label: "中文", pct: lngCoveragePct(zhFlat) },
  ];

  const current = languages.find(l => l.value === locale)!;

  const openDropdown = () => {
    setOpen(true);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => setOpen(false));
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={openDropdown}>
        <Feather name="globe" size={16} color="#a1a1aa" />
        <Text style={styles.triggerText}>
          {current.value.toUpperCase()} {current.label}
        </Text>
        <Feather name="chevron-down" size={16} color="#a1a1aa" />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="none">
        <Pressable style={styles.overlay} onPress={closeDropdown}>
          <Animated.View
            style={[styles.dropdown, { opacity, transform: [{ scale }] }]}
          >
            {languages.map(lng => {
              const active = lng.value === locale;

              return (
                <TouchableOpacity
                  key={lng.value}
                  onPress={() => {
                    i18n.changeLanguage(lng.value);

                    setLocale(lng.value);

                    closeDropdown();
                  }}
                  style={[styles.item, active && styles.activeItem]}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemCode}>
                      {lng.value.toUpperCase()}
                    </Text>
                    <Text style={styles.itemLabel}>{lng.label}</Text>
                  </View>

                  <View style={styles.itemRight}>
                    <Text style={styles.itemPct}>{lng.pct}%</Text>
                    {active && (
                      <Feather name="check" size={16} color="#6366f1" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#09090b",
  },

  triggerText: {
    fontSize: 14,
    color: "#f4f4f5",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  dropdown: {
    width: 240,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#09090b",
    paddingVertical: 8,
  },

  item: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  activeItem: {
    backgroundColor: "rgba(99,102,241,0.1)",
  },

  itemLeft: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  itemCode: {
    fontWeight: "600",
    color: "#e4e4e7",
  },

  itemLabel: {
    color: "#a1a1aa",
  },

  itemRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  itemPct: {
    fontSize: 12,
    color: "#71717a",
  },
});
