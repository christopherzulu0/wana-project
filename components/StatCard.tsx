import React from "react"
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
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
    const titleSize = compact ? fonts.sizes.sm : fonts.sizes.md + 1
    const subtitleSize = compact ? fonts.sizes.xs : fonts.sizes.sm
    const valueSize = compact ? fonts.sizes.lg : fonts.sizes.xxl
    const iconPx = compact ? 18 : 24

    const displayValue =
        typeof value === "number" ? formatNumber(value) : String(value)

    // Use theme colors if provided, otherwise fall back to default colors
    const textColor = themeColors?.text || colors.text
    const textLightColor = themeColors?.textLight || colors.textLight
    const cardBg = themeColors?.card || colors.card
    
    // Create gradient background colors based on the card's color
    // Use darker backgrounds for better text contrast
    const gradientStart = `${color}25`
    const gradientEnd = `${color}12`
    const borderColor = `${color}50`

    return (
        <View style={[styles.cardContainer, { borderColor }]}>
            <LinearGradient
                colors={[gradientStart, gradientEnd]}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={styles.left}>
                            <View style={styles.titleRow}>
                                <View style={[styles.iconWrap, { borderColor: `${color}50` }]}>
                                    <LinearGradient
                                        colors={[`${color}30`, `${color}15`]}
                                        style={styles.iconGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Feather name={icon} size={iconPx} color={color} />
                                    </LinearGradient>
                                </View>
                                <View style={styles.titleContainer}>
                                    <Text
                                        style={[styles.title, { fontSize: titleSize, color: textColor, fontWeight: "600" }]}
                                        accessibilityRole="header"
                                    >
                                        {title}
                                    </Text>
                                    {subtitle ? (
                                        <Text
                                            style={[styles.subtitle, { fontSize: subtitleSize, color: textLightColor, opacity: 0.9 }]}
                                        >
                                            {subtitle}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>

                        <View style={styles.right}>
                            <View style={[styles.valueContainer, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
                                <Text
                                    style={[styles.value, { fontSize: valueSize, color, fontWeight: "700" }]}
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
                </View>
            </LinearGradient>
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
    cardContainer: {
        borderRadius: spacing.lg + 4,
        borderWidth: 1.5,
        width: "100%",
        minHeight: 120,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: spacing.md,
    },
    cardGradient: {
        borderRadius: spacing.lg + 4,
        flex: 1,
    },
    card: {
        paddingVertical: spacing.lg + spacing.md,
        paddingHorizontal: spacing.lg + spacing.md,
        flex: 1,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flex: 1,
    },
    left: {
        flex: 1,
        paddingRight: spacing.md,
        minWidth: 0, // Allows flex to shrink below content size
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        overflow: "hidden",
    },
    iconGradient: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    titleContainer: {
        flex: 1,
        minWidth: 0, // Allows flex to shrink below content size
    },
    title: {
        fontFamily: fonts.regular,
        fontWeight: "600" as const,
        marginBottom: spacing.xs / 2,
        flexShrink: 1,
    } as TextStyle,
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: fonts.sizes.sm,
        flexShrink: 1,
        flexWrap: "wrap",
    },
    right: {
        alignItems: "flex-end",
        justifyContent: "center",
        flexShrink: 0,
        marginLeft: spacing.sm,
    },
    valueContainer: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 12,
        minWidth: 70,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
    },
    value: {
        fontFamily: fonts.regular,
        fontWeight: "700" as const,
    },
})
