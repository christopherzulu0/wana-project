"use client"

import { Feather } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, FlatList } from "react-native"
import { Button } from "./Button"
import { Card } from "./Card"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import { useAuth } from "../hooks/useAuth"

const API_BASE_URL = 'https://attendance-records-wana.vercel.app'

interface AttendanceRequest {
    id: string
    studentId: string
    classId: string
    status: string
    requestedAt: string
    respondedAt?: string
    reason?: string
    student: {
        id: string
        name: string
        email?: string
        registrationNumber?: string
    }
    respondedBy?: {
        id: string
        name: string
    }
}

interface AttendanceRequestsModalProps {
    visible: boolean
    classItem: any
    onClose: () => void
    onRequestHandled: () => void
}

export function AttendanceRequestsModal({ visible, classItem, onClose, onRequestHandled }: AttendanceRequestsModalProps) {
    const { user } = useAuth()
    const [requests, setRequests] = useState<AttendanceRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'pending' | 'all'>('pending')

    useEffect(() => {
        if (visible && classItem) {
            fetchRequests()
        }
    }, [visible, classItem, filter])

    const fetchRequests = async () => {
        if (!classItem?.id) return

        setLoading(true)
        try {
            const url = filter === 'pending'
                ? `${API_BASE_URL}/api/attendance-requests/class/${classItem.id}?status=pending`
                : `${API_BASE_URL}/api/attendance-requests/class/${classItem.id}`

            const response = await fetch(url)

            if (response.ok) {
                const data = await response.json()
                console.log('Fetched requests:', data.requests)
                if (data.requests && data.requests.length > 0) {
                    console.log('First request student data:', data.requests[0].student)
                }
                setRequests(data.requests || [])
            } else {
                console.error('Failed to fetch requests')
                Alert.alert('Error', 'Failed to load attendance requests')
            }
        } catch (err) {
            console.error('Error fetching requests:', err)
            Alert.alert('Error', 'Network error occurred while loading requests')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (requestId: string, studentName: string) => {
        if (!user?.id) return

        Alert.alert(
            'Approve Request',
            `Approve attendance request for ${studentName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setProcessingId(requestId)
                        try {
                            const response = await fetch(
                                `${API_BASE_URL}/api/attendance-requests/${requestId}/approve`,
                                {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        respondedById: user.id,
                                    }),
                                }
                            )

                            if (response.ok) {
                                Alert.alert('Success', `Approved attendance request for ${studentName}`)
                                fetchRequests() // Refresh the list
                                onRequestHandled()
                            } else {
                                const errorData = await response.json()
                                Alert.alert('Error', errorData.error || 'Failed to approve request')
                            }
                        } catch (err) {
                            console.error('Error approving request:', err)
                            Alert.alert('Error', 'Network error occurred')
                        } finally {
                            setProcessingId(null)
                        }
                    },
                },
            ]
        )
    }

    const handleReject = async (requestId: string, studentName: string) => {
        if (!user?.id) return

        Alert.alert(
            'Reject Request',
            `Reject attendance request for ${studentName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingId(requestId)
                        try {
                            const response = await fetch(
                                `${API_BASE_URL}/api/attendance-requests/${requestId}/reject`,
                                {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        respondedById: user.id,
                                    }),
                                }
                            )

                            if (response.ok) {
                                Alert.alert('Success', `Rejected attendance request for ${studentName}`)
                                fetchRequests() // Refresh the list
                                onRequestHandled()
                            } else {
                                const errorData = await response.json()
                                Alert.alert('Error', errorData.error || 'Failed to reject request')
                            }
                        } catch (err) {
                            console.error('Error rejecting request:', err)
                            Alert.alert('Error', 'Network error occurred')
                        } finally {
                            setProcessingId(null)
                        }
                    },
                },
            ]
        )
    }

    const renderRequestItem = ({ item }: { item: AttendanceRequest }) => {
        const isProcessing = processingId === item.id
        const isPending = item.status === 'pending'

        console.log('Rendering request item:', {
            id: item.id,
            studentName: item.student.name,
            studentId: item.studentId
        })

        return (
            <Card variant="outlined" style={styles.requestCard}>
                <View style={styles.requestHeader}>
                    <View style={styles.studentInfo}>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
                            <Feather name="user" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.studentDetails}>
                            <Text style={[styles.studentName, { color: '#FFFFFF', backgroundColor: 'transparent' }]}>
                                {item.student.name || `Student #${item.studentId}`}
                            </Text>
                            {item.student.registrationNumber && (
                                <Text style={styles.studentId}>ID: {item.student.registrationNumber}</Text>
                            )}
                        </View>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        item.status === 'approved' && styles.statusApproved,
                        item.status === 'rejected' && styles.statusRejected,
                        item.status === 'pending' && styles.statusPending,
                    ]}>
                        <Text style={[
                            styles.statusText,
                            item.status === 'approved' && styles.statusTextApproved,
                            item.status === 'rejected' && styles.statusTextRejected,
                            item.status === 'pending' && styles.statusTextPending,
                        ]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                </View>

                <View style={styles.requestInfo}>
                    <View style={styles.infoRow}>
                        <Feather name="clock" size={14} color={colors.textLight} />
                        <Text style={styles.infoText}>
                            Requested {new Date(item.requestedAt).toLocaleString()}
                        </Text>
                    </View>
                    {item.reason && (
                        <View style={styles.infoRow}>
                            <Feather name="message-circle" size={14} color={colors.textLight} />
                            <Text style={styles.infoText}>{item.reason}</Text>
                        </View>
                    )}
                    {item.respondedAt && item.respondedBy && (
                        <View style={styles.infoRow}>
                            <Feather name="check" size={14} color={colors.textLight} />
                            <Text style={styles.infoText}>
                                Responded by {item.respondedBy.name} on {new Date(item.respondedAt).toLocaleString()}
                            </Text>
                        </View>
                    )}
                </View>

                {isPending && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleReject(item.id, item.student.name)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color={colors.danger} />
                            ) : (
                                <>
                                    <Feather name="x" size={16} color={colors.danger} />
                                    <Text style={styles.rejectButtonText}>Reject</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleApprove(item.id, item.student.name)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color={colors.card} />
                            ) : (
                                <>
                                    <Feather name="check" size={16} color={colors.card} />
                                    <Text style={styles.approveButtonText}>Approve</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        )
    }

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={colors.textLight} />
            <Text style={styles.emptyStateTitle}>
                {filter === 'pending' ? 'No Pending Requests' : 'No Requests'}
            </Text>
            <Text style={styles.emptyStateText}>
                {filter === 'pending'
                    ? 'There are no pending attendance requests for this class.'
                    : 'There are no attendance requests for this class yet.'}
            </Text>
        </View>
    )

    const pendingCount = requests.filter(r => r.status === 'pending').length

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Attendance Requests</Text>
                        <Text style={styles.headerSubtitle}>{classItem?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Feather name="x" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Filter tabs */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
                        onPress={() => setFilter('pending')}
                    >
                        <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
                            Pending {pendingCount > 0 && `(${pendingCount})`}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                        onPress={() => setFilter('all')}
                    >
                        <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                            All ({requests.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading requests...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={requests}
                        renderItem={renderRequestItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmptyState}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    headerTitle: {
        fontSize: fonts.sizes.lg,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.bold as any,
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        color: colors.textLight,
        marginTop: spacing.xs / 2,
    },
    closeButton: {
        padding: spacing.sm,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    filterTab: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: spacing.sm,
        backgroundColor: colors.card,
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: colors.primary,
    },
    filterTabText: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.medium as any,
        color: colors.textLight,
    },
    filterTabTextActive: {
        color: colors.card,
        fontWeight: fonts.weights.semibold as any,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        fontSize: fonts.sizes.md,
        fontFamily: fonts.regular,
        color: colors.textLight,
        marginTop: spacing.md,
    },
    listContent: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    requestCard: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    studentDetails: {
        flex: 1,
    },
    studentName: {
        fontSize: fonts.sizes.md,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.semibold as any,
        color: colors.text,
    },
    studentId: {
        fontSize: fonts.sizes.xs,
        fontFamily: fonts.regular,
        color: colors.textLight,
        marginTop: spacing.xs / 2,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: spacing.xs,
    },
    statusPending: {
        backgroundColor: colors.warning + '20',
    },
    statusApproved: {
        backgroundColor: colors.success + '20',
    },
    statusRejected: {
        backgroundColor: colors.danger + '20',
    },
    statusText: {
        fontSize: fonts.sizes.xs,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.semibold as any,
    },
    statusTextPending: {
        color: colors.warning,
    },
    statusTextApproved: {
        color: colors.success,
    },
    statusTextRejected: {
        color: colors.danger,
    },
    requestInfo: {
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    infoText: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        color: colors.textLight,
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: spacing.sm,
        gap: spacing.xs,
    },
    approveButton: {
        backgroundColor: colors.success,
    },
    rejectButton: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    approveButtonText: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.semibold as any,
        color: colors.card,
    },
    rejectButtonText: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.semibold as any,
        color: colors.danger,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyStateTitle: {
        fontSize: fonts.sizes.lg,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.bold as any,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptyStateText: {
        fontSize: fonts.sizes.md,
        fontFamily: fonts.regular,
        color: colors.textLight,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
})
