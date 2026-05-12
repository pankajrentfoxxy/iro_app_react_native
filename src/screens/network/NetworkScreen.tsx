import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useAppSelector } from '@/src/store';
import { Colors } from '@/src/theme/colors';
import { Radius, Spacing } from '@/src/theme/spacing';
import { FontFamily, FontSize } from '@/src/theme/typography';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

const JOIN_BASE = 'https://iro.in/join?ref=';

const { width: windowWidth } = Dimensions.get('window');

type TreeNodeType = {
  id: string;
  name: string;
  role: string;
  children?: TreeNodeType[];
};

const networkData: TreeNodeType = {
  id: 'head',
  name: 'Head',
  role: 'L1',
  children: [
    {
      id: 'p1',
      name: 'P1',
      role: 'L2',
      children: [
        {
          id: 'p1-1',
          name: 'P1.1',
          role: 'L3',
          children: [
            {
              id: 'p1-1-1',
              name: 'P1.1.1',
              role: 'L4',
            },
            {
              id: 'p1-1-2',
              name: 'P1.1.2',
              role: 'L4',
            },
          ],
        },
        {
          id: 'p1-2',
          name: 'P1.2',
          role: 'L3',
        },
        {
          id: 'p1-3',
          name: 'P1.3',
          role: 'L3',
        },
      ],
    },

    {
      id: 'p2',
      name: 'P2',
      role: 'L2',
      children: [
        {
          id: 'p2-1',
          name: 'P2.1',
          role: 'L3',
        },
        {
          id: 'p2-2',
          name: 'P2.2',
          role: 'L3',
          children: [
            {
              id: 'p2-2-1',
              name: 'P2.2.1',
              role: 'L4',
            },
          ],
        },
        {
          id: 'p2-3',
          name: 'P2.3',
          role: 'L3',
        },
      ],
    },

    {
      id: 'p3',
      name: 'P3',
      role: 'L2',
      children: [
        {
          id: 'p3-1',
          name: 'P3.1',
          role: 'L3',
        },
        {
          id: 'p3-2',
          name: 'P3.2',
          role: 'L3',
        },
        {
          id: 'p3-3',
          name: 'P3.3',
          role: 'L3',
          children: [
            {
              id: 'p3-3-1',
              name: 'P3.3.1',
              role: 'L4',
            },
            {
              id: 'p3-3-2',
              name: 'P3.3.2',
              role: 'L4',
            },
          ],
        },
      ],
    },
  ],
};

const NODE_WIDTH = 90;
const LEVEL_HEIGHT = 140;
const TREE_ROOT_Y = 90;
const H_GAP = 52;
const LAYOUT_PAD = 36;
const LINK_PARENT_Y = 34;
const LINK_CHILD_Y = 34;
const NODE_BBOX_HALF = 58;

type MeasuredNode = {
  id: string;
  raw: TreeNodeType;
  subW: number;
  kids: MeasuredNode[];
};

function buildMeasured(node: TreeNodeType): MeasuredNode {
  const leafMin = NODE_WIDTH + H_GAP * 2;
  if (!node.children?.length) {
    return { id: node.id, raw: node, subW: leafMin, kids: [] };
  }
  const kids = node.children.map(buildMeasured);
  const sum = kids.reduce((s, k) => s + k.subW, 0) + H_GAP * (kids.length - 1);
  return { id: node.id, raw: node, subW: Math.max(leafMin, sum), kids };
}

function assignPositions(
  m: MeasuredNode,
  left: number,
  depth: number,
  out: Map<string, { x: number; y: number }>,
) {
  const y = TREE_ROOT_Y + depth * LEVEL_HEIGHT;
  if (!m.kids.length) {
    out.set(m.id, { x: left + m.subW / 2, y });
    return;
  }
  let cur = left;
  for (let i = 0; i < m.kids.length; i++) {
    assignPositions(m.kids[i], cur, depth + 1, out);
    cur += m.kids[i].subW + (i < m.kids.length - 1 ? H_GAP : 0);
  }
  const x0 = out.get(m.kids[0].id)!.x;
  const x1 = out.get(m.kids[m.kids.length - 1].id)!.x;
  out.set(m.id, { x: (x0 + x1) / 2, y });
}

function computeNetworkLayout(root: TreeNodeType): {
  positions: Map<string, { x: number; y: number }>;
  width: number;
  height: number;
} {
  const measured = buildMeasured(root);
  const positions = new Map<string, { x: number; y: number }>();
  assignPositions(measured, 0, 0, positions);

  let minLeft = Infinity;
  let maxRight = -Infinity;
  let minTop = Infinity;
  let maxBottom = -Infinity;
  for (const { x, y } of positions.values()) {
    minLeft = Math.min(minLeft, x - NODE_WIDTH / 2);
    maxRight = Math.max(maxRight, x + NODE_WIDTH / 2);
    minTop = Math.min(minTop, y - NODE_BBOX_HALF);
    maxBottom = Math.max(maxBottom, y + NODE_BBOX_HALF);
  }
  const dx = LAYOUT_PAD - minLeft;
  const dy = LAYOUT_PAD - minTop;
  for (const [id, p] of positions.entries()) {
    positions.set(id, { x: p.x + dx, y: p.y + dy });
  }
  const contentW = maxRight - minLeft + LAYOUT_PAD * 2;
  const contentH = maxBottom - minTop + LAYOUT_PAD * 2;
  const width = Math.max(windowWidth * 1.15, contentW);
  const height = Math.max(TREE_ROOT_Y + LEVEL_HEIGHT * 4 + LAYOUT_PAD * 2, contentH);
  return { positions, width, height };
}

function collectIds(node: TreeNodeType, acc: string[] = []): string[] {
  acc.push(node.id);
  node.children?.forEach((c) => collectIds(c, acc));
  return acc;
}

type TreeEdge = { parentId: string; childId: string };

function collectVisibleEdges(node: TreeNodeType, expanded: Record<string, boolean>, edges: TreeEdge[] = []): TreeEdge[] {
  if (!expanded[node.id]) return edges;
  for (const c of node.children ?? []) {
    edges.push({ parentId: node.id, childId: c.id });
    collectVisibleEdges(c, expanded, edges);
  }
  return edges;
}

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const code = user?.reformerId ?? 'IRO-DEMO';
  const link = `${JOIN_BASE}${encodeURIComponent(code)}`;
  const [tab, setTab] = useState<'tree' | 'share'>('tree');
  const networkCount = user?.networkCount ?? 47;
  const progress = Math.min(1, networkCount / 100);

  const msg = useMemo(
    () =>
      `नमस्ते! मैं IRO का सदस्य हूँ — भारत बदलने का एक आंदोलन।\nमेरे link से join करें और Reformer बनें 🔥\n${link}`,
    [link]
  );

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Referral code copied to clipboard');
  };

  const shareWhatsAppStyle = async () => {
    try {
      await Share.share({ message: msg });
    } catch {
      /* noop */
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>Network</Text>
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('tree')} style={[styles.tab, tab === 'tree' && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === 'tree' && styles.tabTxtOn]}>My tree</Text>
          {tab === 'tree' ? <View style={styles.tabLine} /> : null}
        </Pressable>
        <Pressable onPress={() => setTab('share')} style={[styles.tab, tab === 'share' && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === 'share' && styles.tabTxtOn]}>Share</Text>
          {tab === 'share' ? <View style={styles.tabLine} /> : null}
        </Pressable>
      </View>

      {tab === 'tree' ? (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.treeCard}>
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
              <NetworkTreeCanvas root={networkData} />
            </ScrollView>
          </View>

          <SectionHeader title="Your impact" />
          <Text style={styles.body}>
            You&apos;ve brought <Text style={styles.em}>{user?.directReferrals ?? 12}</Text> Reformers directly.
          </Text>
          <Text style={styles.body}>
            Your extended network: <Text style={styles.em}>{networkCount}</Text> total
          </Text>
          <ProgressBar progress={progress} />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.qrCard}>
            <QRCode value={link} size={200} backgroundColor={Colors.white} color={Colors.navy} />
          </View>
          <Text style={styles.mono}>{code}</Text>

          <View style={styles.codeRow}>
            <Text style={styles.codeBig}>{code}</Text>
            <Button title="Copy 📋" variant="outline" onPress={() => void copyCode()} style={styles.copyBtn} />
          </View>

          <Text style={styles.shareLbl}>Share</Text>
          <View style={styles.shareGrid}>
            <Button title="📱 Invite" onPress={() => void shareWhatsAppStyle()} />
            <Button title="💬 Message" variant="outline" onPress={() => void shareWhatsAppStyle()} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function NetworkTreeCanvas({ root }: { root: TreeNodeType }) {
  const layout = useMemo(() => computeNetworkLayout(root), [root]);
  const allIds = useMemo(() => collectIds(root), [root]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allIds.map((id) => [id, true] as const)),
  );

  const edges = useMemo(() => collectVisibleEdges(root, expanded), [root, expanded]);

  const toggle = useCallback((id: string) => {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }, []);

  return (
    <View style={{ width: layout.width, height: layout.height, position: 'relative' }}>
      <Svg
        width={layout.width}
        height={layout.height}
        style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
        pointerEvents="none"
      >
        {edges.map(({ parentId, childId }) => {
          const a = layout.positions.get(parentId);
          const b = layout.positions.get(childId);
          if (!a || !b) return null;
          return (
            <Line
              key={`${parentId}-${childId}`}
              x1={a.x}
              y1={a.y + LINK_PARENT_Y}
              x2={b.x}
              y2={b.y - LINK_CHILD_Y}
              stroke={Colors.saffron}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
      <Subtree node={root} positions={layout.positions} expanded={expanded} onToggle={toggle} visible />
    </View>
  );
}

type SubtreeProps = {
  node: TreeNodeType;
  positions: Map<string, { x: number; y: number }>;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  visible: boolean;
};

function Subtree({ node, positions, expanded, onToggle, visible }: SubtreeProps) {
  if (!visible) return null;
  const pos = positions.get(node.id);
  if (!pos) return null;
  const isExpanded = expanded[node.id] ?? false;
  return (
    <>
      <TreeNodeCard
        node={node}
        x={pos.x}
        y={pos.y}
        expanded={isExpanded}
        onToggle={() => onToggle(node.id)}
      />
      {node.children?.map((c) => (
        <Subtree
          key={c.id}
          node={c}
          positions={positions}
          expanded={expanded}
          onToggle={onToggle}
          visible={isExpanded}
        />
      ))}
    </>
  );
}

type TreeNodeCardProps = {
  node: TreeNodeType;
  x: number;
  y: number;
  expanded: boolean;
  onToggle: () => void;
};

function TreeNodeCard({ node, x, y, expanded, onToggle }: TreeNodeCardProps) {
  return (
    <View
      style={[
        treeStyles.nodeContainer,
        {
          left: x - NODE_WIDTH / 2,
          top: y - 30,
          zIndex: 2,
          elevation: 3,
        },
      ]}
    >
      <Pressable style={treeStyles.node} onPress={onToggle}>
        <CircleAvatar role={node.role} />
        <Text style={treeStyles.name}>{node.name}</Text>
        <Text style={treeStyles.role}>{node.role}</Text>
        <Text style={treeStyles.expandText}>{expanded ? 'Hide' : 'Show'}</Text>
      </Pressable>
    </View>
  );
}

function CircleAvatar({ role }: { role: string }) {
  const color = getRoleColor(role);
  return <View style={[treeStyles.avatar, { backgroundColor: color }]} />;
}

function getRoleColor(role: string) {
  switch (role) {
    case 'L1':
      return '#FFD700';
    case 'L2':
      return '#8B5CF6';
    case 'L3':
      return '#2563EB';
    case 'L4':
      return '#06B6D4';
    case 'L5':
      return '#22C55E';
    case 'L6':
      return '#F97316';
    case 'L7':
      return '#EA580C';
    case 'L8':
      return '#94A3B8';
    default:
      return '#64748B';
  }
}

const treeStyles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    width: NODE_WIDTH,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg - 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginBottom: Spacing.sm,
  },
  name: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.white,
    fontSize: FontSize.body,
  },
  role: {
    fontFamily: FontFamily.body,
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    marginTop: Spacing.xs,
  },
  expandText: {
    fontFamily: FontFamily.bodySemi,
    color: Colors.saffronLight,
    fontSize: FontSize.micro,
    marginTop: Spacing.sm,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  screenTitle: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  tab: {
    paddingVertical: Spacing.md,
  },
  tabOn: {},
  tabTxt: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.body,
    color: Colors.textMuted,
  },
  tabTxtOn: {
    color: Colors.saffron,
  },
  tabLine: {
    marginTop: Spacing.xs,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.saffron,
  },
  treeCard: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  em: {
    color: Colors.saffron,
    fontFamily: FontFamily.bodySemi,
  },
  qrCard: {
    alignSelf: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  mono: {
    textAlign: 'center',
    fontFamily: FontFamily.mono,
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  codeBig: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 22,
    color: Colors.saffron,
  },
  copyBtn: {
    flex: 0,
    paddingHorizontal: Spacing.sm,
  },
  shareLbl: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.body,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  shareGrid: {
    gap: Spacing.sm,
  },
});
