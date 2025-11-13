import React from "react"
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native"
import { Feather } from "@expo/vector-icons"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"

export type StatCardProps = {
    title: string
    value: string | number
    icon: React.ComponentProps<typeof Feather>["name"]
    color?: string
    subtitle?: string
    compact?: boolean
    themeColors?: {
        card: string
        text: string
        textLight: string
        borderLight: string
    }
}

export function StatCard({
    title,
    value,
    icon,
    color = colors.primary,
    subtitle,
    compact = false,
    themeColors,
}: StatCardProps) {
    const titleSize = compact ? fonts.sizes.sm : fonts.sizes.md
    const subtitleSize = compact ? fonts.sizes.xs : fonts.sizes.sm
    const valueSize = compact ? fonts.sizes.lg : fonts.sizes.xl
    const iconPx = compact ? 18 : 20

    const displayValue =
        typeof value === "number" ? formatNumber(value) : String(value)

    // Use theme colors if provided, otherwise fall back to default colors
    const cardBg = themeColors?.card || colors.card
    const textColor = themeColors?.text || colors.text
    const textLightColor = themeColors?.textLight || colors.textLight
    const borderColor = themeColors?.borderLight || colors.borderLight

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.row}>
                <View style={styles.left}>
                    <View style={styles.titleRow}>
                        <View style={[styles.iconWrap, { backgroundColor: `${color}15`, borderColor: `${color}22` }]}>
                            <Feather name={icon} size={iconPx} color={color} />
                        </View>
                        <Text
                            style={[styles.title, { fontSize: titleSize, color: textColor }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            accessibilityRole="header"
                        >
                            {title}
                        </Text>
                    </View>
                    {subtitle ? (
                        <Text
                            style={[styles.subtitle, { fontSize: subtitleSize, color: textLightColor }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.right}>
                    <Text
                        style={[styles.value, { fontSize: valueSize, color }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                        ellipsizeMode="clip"
                        accessibilityLabel={`${title} ${displayValue}`}
                    >
                        {displayValue}
                    </Text>
                </View>
            </View>
        </View>
    )
}

function formatNumber(n: number) {
    if (n < 1000) return `${n}`
    if (n < 10000) return `${(n / 1000).toFixed(1)}k`.replace(".0", "")
    if (n < 1_000_000) return `${Math.round(n / 1000)}k`
    if (n < 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`.replace(".0", "")
    return `${Math.round(n / 1_000_000)}M`
}

/* Styles */

const styles = StyleSheet.create({
    card: {
        borderRadius: spacing.md,
        borderWidth: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        flex: 1,
        minWidth: 140,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    left: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.xs / 2,
        minHeight: 28,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    title: {
        flexShrink: 1,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.semibold,
    } as TextStyle,
    subtitle: {
        fontFamily: fonts.regular,
    },
    right: {
        maxWidth: "40%",
        alignItems: "flex-end",
        justifyContent: "center",
    },
    value: {
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.bold,
    },
})
