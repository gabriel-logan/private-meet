import React, { useEffect, useRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CreateUser from "../components/CreateUser";
import JoinMeeting from "../components/JoinMeeting";
import SelectLanguage from "../components/SelectLanguage";
import { useAuthStore } from "../stores/authStore";

function Header() {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <View style={styles.headerBase}>
        <View style={styles.headerAboutView}>
          <TouchableOpacity
            onPress={async () => {
              const url = "https://private-meet-76by.onrender.com/about";

              if (await Linking.canOpenURL(url)) {
                await Linking.openURL(url);
              }
            }}
          >
            <Text style={styles.headerAboutText}>{t("Header.About")}</Text>
          </TouchableOpacity>
        </View>
        <SelectLanguage />
      </View>
    </View>
  );
}

export default function HomePage() {
  const { t } = useTranslation();

  const accessToken = useAuthStore(s => s.accessToken);

  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.card}>
        <Animated.Text
          style={[
            styles.title,
            // eslint-disable-next-line react-native/no-inline-styles
            {
              opacity,
              textShadowColor: "rgba(99,102,241,0.6)",
              textShadowRadius: 12,
              textShadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <Trans i18nKey="WelcomeMessage" t={t}>
            Welcome to <Text style={styles.highlight}>Private Meet</Text>
          </Trans>
        </Animated.Text>

        <Text style={styles.subtitle}>{t("IntroductionText")}</Text>

        {accessToken ? <JoinMeeting /> : <CreateUser />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 22,
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  headerBase: {
    gap: 12,
  },

  headerAboutView: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  headerAboutText: {
    color: "#f4f4f5",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#09090b",
  },

  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "rgba(24,24,27,0.9)",
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },

  title: {
    marginBottom: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.5,
    color: "#f4f4f5",
  },

  highlight: {
    color: "#6366f1",
  },

  subtitle: {
    marginBottom: 32,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#a1a1aa",
  },
});
