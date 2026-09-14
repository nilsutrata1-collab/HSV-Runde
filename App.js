import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { supabase } from "./supabase";

const blue = "#0057B8";
const navy = "#061B35";
const light = "#F1F6FC";
const Tab = createBottomTabNavigator();

function showMessage(title, message) {
  if (typeof window !== "undefined" && window.alert) window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

function Logo({ small = false }) {
  return (
    <View style={[styles.logo, { width: small ? 38 : 52, height: small ? 38 : 52 }]}>
      <View style={styles.diamond}><View style={styles.diamondInner} /></View>
    </View>
  );
}

function Pill({ status }) {
  const map = { dabei: ["Dabei", "#159447"], vielleicht: ["Vielleicht", "#D88700"], nicht: ["Kann nicht", "#D92D20"] };
  const [label, color] = map[status] || ["Offen", "#667085"];
  return <View style={[styles.pill, { backgroundColor: color + "18" }]}><Text style={{ color, fontWeight: "800", fontSize: 12 }}>{label}</Text></View>;
}

function dateText(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function loadMatches() {
  const { data, error } = await supabase.from("matches").select("*").order("match_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

function Auth() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) return showMessage("Fehlt noch etwas", "Bitte E-Mail und Passwort eingeben.");
    if (mode === "signup" && !name.trim()) return showMessage("Fehlt noch etwas", "Bitte deinen Namen eingeben.");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          showMessage("Fast geschafft!", "Bitte bestätige zuerst die E-Mail, die Supabase an dich geschickt hat. Danach kannst du dich hier anmelden.");
        }
      }
    } catch (e) {
      showMessage("Anmeldung", e.message || "Es ist ein Fehler aufgetreten.");
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={styles.auth}>
    <StatusBar style="light" />
    <View style={styles.authTop}>
      <Logo />
      <Text style={styles.authTitle}>HSV-RUNDE</Text>
      <Text style={styles.authSub}>Spiele planen. Freunde einladen. Gemeinsam dabei sein.</Text>
    </View>
    <View style={styles.authCard}>
      <Text style={styles.h1}>{mode === "login" ? "Willkommen zurück!" : "Konto erstellen"}</Text>
      {mode === "signup" && <TextInput style={styles.input} placeholder="Dein Name" value={name} onChangeText={setName} />}
      <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="E-Mail-Adresse" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} secureTextEntry placeholder="Passwort" value={password} onChangeText={setPassword} />
      <Pressable style={styles.primary} onPress={submit} disabled={busy}><Text style={styles.primaryText}>{busy ? "Bitte warten…" : mode === "login" ? "Anmelden" : "Registrieren"}</Text></Pressable>
      <Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")}><Text style={styles.link}>{mode === "login" ? "Noch kein Konto? Registrieren" : "Bereits ein Konto? Anmelden"}</Text></Pressable>
    </View>
  </SafeAreaView>;
}

function Home({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { loadMatches().then(setMatches).catch(e => setError(e.message)); }, []);
  const next = matches[0];
  return <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 30 }}>
    <View style={styles.header}><Logo small /><View><Text style={styles.headerTitle}>HSV-Runde</Text><Text style={styles.muted}>Gemeinsam. Für den HSV.</Text></View></View>
    <Text style={styles.section}>Nächstes Spiel</Text>
    {error ? <View style={styles.card}><Text style={styles.error}>{error}</Text></View> : !next ? <View style={styles.card}><Text style={styles.h2}>Noch keine Spiele</Text><Text style={styles.muted}>Sobald ein Spiel in Supabase angelegt ist, erscheint es hier.</Text></View> : <Pressable onPress={() => navigation.navigate("Spiele", { screen: "details", match: next })} style={styles.card}>
      <View style={styles.row}><Logo small /><Text style={styles.vs}>VS</Text><Text style={styles.opponent}>{next.opponent}</Text></View>
      <Text style={styles.bold}>{dateText(next.match_date)}</Text><Text style={styles.muted}>{next.venue || "Spielort noch offen"}</Text>
      <View style={styles.cta}><Text style={styles.primaryText}>Details & Zusagen</Text></View>
    </Pressable>}
    <Text style={styles.section}>Weitere Spiele</Text>
    {matches.slice(1).map(m => <Pressable key={m.id} onPress={() => navigation.navigate("Spiele", { screen: "details", match: m })} style={styles.listCard}><Logo small /><View style={{ flex: 1 }}><Text style={styles.bold}>HSV – {m.opponent}</Text><Text style={styles.muted}>{dateText(m.match_date)}</Text></View><Text style={{ color: blue, fontSize: 24 }}>›</Text></Pressable>)}
  </ScrollView>;
}

function Matches({ navigation, route }) {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { loadMatches().then(setMatches).catch(e => setError(e.message)); }, []);
  const detail = route?.params?.match;
  if (detail) return <MatchDetails match={detail} onBack={() => navigation.setParams({ match: null })} />;
  return <SafeAreaView style={styles.page}><Text style={styles.title}>Spiele</Text>{error ? <View style={styles.card}><Text style={styles.error}>{error}</Text></View> : <FlatList data={matches} keyExtractor={x => x.id} contentContainerStyle={{ padding: 16 }} ListEmptyComponent={<Text style={styles.muted}>Keine Spiele gefunden.</Text>} renderItem={({ item }) => <Pressable style={styles.listCard} onPress={() => navigation.setParams({ match: item })}><Logo small /><View style={{ flex: 1 }}><Text style={styles.bold}>HSV – {item.opponent}</Text><Text style={styles.muted}>{dateText(item.match_date)}</Text></View><Text style={{ color: blue, fontSize: 24 }}>›</Text></Pressable>} />}</SafeAreaView>;
}

function MatchDetails({ match, onBack }) {
  const [status, setStatus] = useState("dabei");
  const [reason, setReason] = useState("");
  const [participants, setParticipants] = useState([]);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(null);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    if (!user) return;
    const [{ data: response }, { data: privateRow }] = await Promise.all([
      supabase.from("responses").select("status").eq("match_id", match.id).eq("user_id", user.id).maybeSingle(),
      supabase.from("private_commitments").select("reason").eq("match_id", match.id).eq("user_id", user.id).maybeSingle(),
    ]);
    if (response?.status) setStatus(response.status);
    if (privateRow?.reason) setReason(privateRow.reason);
    const { data: rows, error } = await supabase.from("responses").select("user_id,status").eq("match_id", match.id);
    if (!error && rows?.length) {
      const ids = rows.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id,display_name").in("id", ids);
      const byId = Object.fromEntries((profiles || []).map(p => [p.id, p.display_name || "HSV-Fan"]));
      setParticipants(rows.map(r => ({ ...r, display_name: r.user_id === user.id ? "Du" : byId[r.user_id] || "HSV-Fan" })));
    } else setParticipants([]);
  }
  useEffect(() => { load().catch(() => {}); }, [match.id]);

  async function save() {
    if (!userId) return;
    setBusy(true);
    try {
      const { error: rError } = await supabase.from("responses").upsert({ match_id: match.id, user_id: userId, status, updated_at: new Date().toISOString() }, { onConflict: "match_id,user_id" });
      if (rError) throw rError;
      const { error: pError } = await supabase.from("private_commitments").upsert({ match_id: match.id, user_id: userId, reason, updated_at: new Date().toISOString() }, { onConflict: "match_id,user_id" });
      if (pError) throw pError;
      await load();
      showMessage("Gespeichert", "Deine Teilnahme und dein privater Grund wurden gespeichert.");
    } catch (e) { showMessage("Fehler", e.message); }
    finally { setBusy(false); }
  }

  return <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
    <Pressable onPress={onBack}><Text style={styles.linkBack}>‹ Zurück</Text></Pressable>
    <View style={styles.hero}><View style={styles.row}><Logo /><Text style={styles.vsLight}>VS</Text><Text style={styles.heroOpponent}>{match.opponent}</Text></View><Text style={styles.heroText}>{dateText(match.match_date)}</Text><Text style={styles.heroSmall}>{match.venue || "Spielort noch offen"}</Text></View>
    <View style={styles.card}>
      <Text style={styles.h2}>Deine Teilnahme</Text>
      <View style={styles.segment}>{["dabei", "vielleicht", "nicht"].map(s => <Pressable key={s} onPress={() => setStatus(s)} style={[styles.segmentItem, status === s && styles.segmentSelected]}><Text style={{ fontWeight: "800" }}>{s === "dabei" ? "Dabei" : s === "vielleicht" ? "Vielleicht" : "Kann nicht"}</Text></Pressable>)}</View>
      <Text style={styles.label}>Persönlicher Grund <Text style={styles.muted}>(nur für dich sichtbar)</Text></Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} multiline placeholder="z. B. Geburtstag, Arbeit, Urlaub …" value={reason} onChangeText={setReason} />
      <Pressable style={styles.primary} onPress={save} disabled={busy}><Text style={styles.primaryText}>{busy ? "Speichern…" : "Speichern"}</Text></Pressable>
    </View>
    <Text style={styles.section}>Teilnehmer</Text>
    {participants.length === 0 ? <Text style={styles.muted}>Noch keine Zusagen.</Text> : participants.map(p => <View style={styles.listCard} key={p.user_id}><View style={styles.avatar}><Text style={{ fontWeight: "900" }}>{(p.display_name || "H")[0]}</Text></View><Text style={{ flex: 1, fontWeight: "700" }}>{p.display_name}</Text><Pill status={p.status} /></View>)}
  </ScrollView>;
}

function Calendar() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [show, setShow] = useState(false);
  const [date, setDate] = useState("");
  const [matches, setMatches] = useState([]);
  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from("private_commitments").select("id,reason,match_id,updated_at").eq("user_id", user.id).order("updated_at", { ascending: true }),
      loadMatches(),
    ]);
    setItems(c || []); setMatches(m || []);
  }
  useEffect(() => { load().catch(() => {}); }, []);
  async function add() {
    if (!title.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const match = matches.find(m => m.id === date);
    const { error } = await supabase.from("private_commitments").insert({ user_id: user.id, match_id: match?.id || matches[0]?.id, reason: title.trim() });
    if (error) return showMessage("Fehler", error.message);
    setTitle(""); setDate(""); setShow(false); await load();
  }
  return <SafeAreaView style={styles.page}><View style={styles.titleRow}><Text style={styles.title}>Kalender</Text><Pressable onPress={() => setShow(true)}><Text style={styles.plus}>＋</Text></Pressable></View>
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.month}><Text style={styles.h2}>Deine HSV-Termine</Text><Text style={styles.muted}>Private Gründe bleiben nur bei dir.</Text></View>
      {matches.map(m => <View style={styles.listCard} key={m.id}><Text style={{ fontSize: 24 }}>⚽</Text><View style={{ flex: 1 }}><Text style={styles.bold}>HSV – {m.opponent}</Text><Text style={styles.muted}>{dateText(m.match_date)}</Text></View></View>)}
      {items.map(x => <View style={styles.listCard} key={x.id}><Text style={{ fontSize: 24 }}>📅</Text><View style={{ flex: 1 }}><Text style={styles.bold}>{x.reason || "Private Verpflichtung"}</Text><Text style={styles.muted}>Privat</Text></View></View>)}
    </ScrollView>
    {show && <View style={styles.modal}><View style={styles.card}><Text style={styles.h2}>Private Verpflichtung</Text><TextInput style={styles.input} placeholder="z. B. Geburtstag, Arbeit, Urlaub" value={title} onChangeText={setTitle} /><Text style={styles.muted}>Sie wird nicht als Grund für deine Absage veröffentlicht.</Text><Pressable style={styles.primary} onPress={add}><Text style={styles.primaryText}>Speichern</Text></Pressable><Pressable onPress={() => setShow(false)}><Text style={styles.link}>Abbrechen</Text></Pressable></View></View>}
  </SafeAreaView>;
}

function Friends() {
  const [members, setMembers] = useState([]);
  const [invite, setInvite] = useState("");
  useEffect(() => {
    supabase.from("group_members").select("user_id,group_id,profiles(display_name)").then(({ data }) => setMembers(data || []));
  }, []);
  async function inviteFriend() {
    const code = `HSV-RUNDE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setInvite(code);
    showMessage("Einladung", `Dein Einladungscode ist:\n${code}\n\nDie echte Einladungslink-Funktion bauen wir als nächsten Ausbauschritt ein.`);
  }
  return <SafeAreaView style={styles.page}><View style={styles.titleRow}><Text style={styles.title}>Freunde</Text><Text style={styles.plus}>＋</Text></View><ScrollView contentContainerStyle={{ padding: 16 }}>
    <View style={styles.groupCard}><Text style={styles.h2}>HSV-Runde</Text><Text style={styles.muted}>{members.length || 1} Mitglieder</Text><Pressable style={styles.outline} onPress={inviteFriend}><Text style={{ color: blue, fontWeight: "800" }}>Freunde einladen</Text></Pressable>{invite ? <Text style={styles.invite}>{invite}</Text> : null}</View>
    {members.length ? members.map(m => <View style={styles.listCard} key={m.user_id}><View style={styles.avatar}><Text style={{ fontWeight: "900" }}>{(m.profiles?.display_name || "H")[0]}</Text></View><Text style={{ flex: 1, fontWeight: "700" }}>{m.profiles?.display_name || "HSV-Fan"}</Text></View>) : <Text style={styles.muted}>Noch keine Freunde in der Gruppe.</Text>}
  </ScrollView></SafeAreaView>;
}

function More({ onLogout }) {
  const [profile, setProfile] = useState(null);
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (user) supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data)); }); }, []);
  return <SafeAreaView style={styles.page}><Text style={styles.title}>Mehr</Text><ScrollView contentContainerStyle={{ padding: 16 }}>
    <View style={styles.profile}><View style={styles.avatarBig}><Text style={{ fontWeight: "900" }}>DU</Text></View><View><Text style={styles.h2}>Mein Profil</Text><Text style={styles.muted}>{profile?.display_name || "HSV-Runde"}</Text></View></View>
    {["Meine Gruppe", "Mein Kalender", "Benachrichtigungen", "Einstellungen", "Hilfe & Support"].map(x => <View style={styles.menu} key={x}><Text style={styles.bold}>{x}</Text><Text style={{ color: blue, fontSize: 22 }}>›</Text></View>)}
    <Pressable onPress={onLogout} style={[styles.outline, { marginTop: 20 }]}><Text style={{ color: "#D92D20", fontWeight: "800" }}>Abmelden</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

function MainApp({ onLogout }) {
  return <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "white", primary: blue } }}>
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: blue }}>
      <Tab.Screen name="Home" component={Home} options={{ tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>⌂</Text> }} />
      <Tab.Screen name="Spiele" component={Matches} options={{ tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>⚽</Text> }} />
      <Tab.Screen name="Kalender" component={Calendar} options={{ tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>▣</Text> }} />
      <Tab.Screen name="Freunde" component={Friends} options={{ tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>♧</Text> }} />
      <Tab.Screen name="Mehr">{() => <More onLogout={onLogout} />}</Tab.Screen>
    </Tab.Navigator>
  </NavigationContainer>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  if (!ready) return <SafeAreaView style={styles.center}><Text>HSV-Runde lädt…</Text></SafeAreaView>;
  return session ? <MainApp onLogout={() => supabase.auth.signOut()} /> : <Auth />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  auth: { flex: 1, backgroundColor: navy }, authTop: { flex: 0.58, alignItems: "center", justifyContent: "center", padding: 24 },
  authTitle: { color: "white", fontWeight: "900", fontSize: 30, letterSpacing: 1 }, authSub: { color: "#DCEBFF", marginTop: 12, textAlign: "center" },
  authCard: { backgroundColor: "white", flex: 0.42, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  page: { flex: 1, backgroundColor: "white" }, header: { padding: 18, flexDirection: "row", alignItems: "center", gap: 12 }, headerTitle: { fontSize: 22, fontWeight: "900", color: navy },
  title: { fontSize: 30, fontWeight: "900", color: navy, padding: 18, paddingBottom: 8 }, titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, plus: { fontSize: 30, color: blue, paddingHorizontal: 18 },
  section: { fontSize: 19, fontWeight: "900", color: navy, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 }, h1: { fontSize: 24, fontWeight: "900", marginBottom: 20, color: navy }, h2: { fontSize: 18, fontWeight: "900", color: navy }, muted: { color: "#667085", fontSize: 13 }, bold: { fontWeight: "800", color: navy },
  card: { marginHorizontal: 16, backgroundColor: "white", borderRadius: 20, padding: 18, shadowColor: "#000", shadowOpacity: .08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, listCard: { marginBottom: 10, backgroundColor: light, borderRadius: 15, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 }, logo: { backgroundColor: "white", borderWidth: 3, borderColor: blue, alignItems: "center", justifyContent: "center" }, diamond: { width: 27, height: 27, backgroundColor: "#111", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center" }, diamondInner: { width: 15, height: 15, backgroundColor: "white" },
  vs: { fontWeight: "900", color: "#667085" }, opponent: { fontSize: 20, fontWeight: "900", color: navy, flex: 1 }, cta: { backgroundColor: blue, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 15 }, primary: { backgroundColor: blue, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8 }, primaryText: { color: "white", fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 12, padding: 13, marginBottom: 12, backgroundColor: "white" }, link: { color: blue, textAlign: "center", fontWeight: "700", padding: 14 }, linkBack: { color: blue, fontWeight: "800", paddingVertical: 8 },
  hero: { backgroundColor: navy, borderRadius: 22, padding: 20, marginBottom: 16 }, vsLight: { fontWeight: "900", color: "#DCEBFF" }, heroOpponent: { fontSize: 24, fontWeight: "900", color: "white", flex: 1 }, heroText: { color: "white", fontWeight: "800", marginTop: 18 }, heroSmall: { color: "#DCEBFF", marginTop: 5 },
  segment: { flexDirection: "row", marginTop: 12, marginBottom: 18, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 12, overflow: "hidden" }, segmentItem: { flex: 1, padding: 11, alignItems: "center" }, segmentSelected: { backgroundColor: "#E6F0FF" }, label: { fontWeight: "800", color: navy, marginBottom: 8 }, pill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "white", alignItems: "center", justifyContent: "center" }, avatarBig: { width: 58, height: 58, borderRadius: 29, backgroundColor: light, alignItems: "center", justifyContent: "center" }, profile: { flexDirection: "row", alignItems: "center", gap: 14, paddingBottom: 16 }, menu: { paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: "#EAECF0", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, outline: { borderWidth: 1, borderColor: blue, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 14 }, groupCard: { backgroundColor: light, borderRadius: 18, padding: 18, marginBottom: 16 }, invite: { marginTop: 12, fontSize: 20, fontWeight: "900", textAlign: "center", color: navy }, month: { marginBottom: 14 }, modal: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,.35)", justifyContent: "center", padding: 16 }, error: { color: "#D92D20", fontWeight: "700" }
});
