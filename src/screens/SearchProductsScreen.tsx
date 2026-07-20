import React, { useState, useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { SearchIcon, PhoneIcon } from '../components/Icons';
import { searchProducts } from '../services/api';

interface Product {
    productName: string;
    productPrice: number;
    imageUrl: string;
    supplierName: string;
    supplierContact: string;
}

export default function SearchProductsScreen() {
    const { colors } = useAppTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) {
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            const data = await searchProducts(trimmed);
            setResults(Array.isArray(data) ? data : []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const renderItem = ({ item }: { item: Product }) => (
        <View style={[s.card, { backgroundColor: colors.card }]}>
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={s.cardImage} resizeMode="cover" />
            ) : (
                <View style={[s.cardImage, s.cardImagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                    <SearchIcon size={28} color={colors.caption} />
                </View>
            )}
            <View style={s.cardBody}>
                <Text style={[s.cardName, { color: colors.text }]} numberOfLines={1}>
                    {item.productName}
                </Text>
                <Text style={[s.cardPrice, { color: colors.green }]}>
                    GHS {Number(item.productPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[s.cardSupplier, { color: colors.muted }]} numberOfLines={1}>
                    {item.supplierName}
                </Text>
                {item.supplierContact ? (
                    <View style={s.contactRow}>
                        <PhoneIcon size={12} color={colors.caption} />
                        <Text style={[s.cardContact, { color: colors.caption }]} numberOfLines={1}>
                            {item.supplierContact}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={s.container}>
                <Text style={[s.pageTitle, { color: colors.text }]}>Search Products</Text>
                <Text style={[s.subtitle, { color: colors.muted }]}>
                    Find products from suppliers across Ghana
                </Text>

                <View style={[s.searchWrap, { backgroundColor: colors.card }]}>
                    <SearchIcon size={18} color={colors.caption} />
                    <TextInput
                        value={query}
                        onChangeText={(text) => {
                            setQuery(text);
                            if (text.trim()) {
                                handleSearch(text);
                            } else {
                                setResults([]);
                                setSearched(false);
                            }
                        }}
                        placeholder="e.g. Cocoa beans, Rice, Garments..."
                        placeholderTextColor={colors.caption}
                        style={[s.searchInput, { color: colors.text }]}
                        returnKeyType="search"
                        onSubmitEditing={() => handleSearch(query)}
                        autoCorrect={false}
                    />
                </View>

                {loading ? (
                    <View style={s.centered}>
                        <ActivityIndicator size="large" color={colors.navy} />
                        <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.md }]}>
                            Searching products...
                        </Text>
                    </View>
                ) : !searched ? (
                    <View style={s.centered}>
                        <View style={[s.emptyIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                            <SearchIcon size={40} color={colors.caption} strokeWidth={1.2} />
                        </View>
                        <Text style={[s.emptyTitle, { color: colors.text }]}>Discover products</Text>
                        <Text style={[s.emptyText, { color: colors.muted }]}>
                            Type a product name above to search suppliers
                        </Text>
                    </View>
                ) : results.length === 0 ? (
                    <View style={s.centered}>
                        <View style={[s.emptyIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                            <SearchIcon size={40} color={colors.caption} strokeWidth={1.2} />
                        </View>
                        <Text style={[s.emptyTitle, { color: colors.text }]}>No products found</Text>
                        <Text style={[s.emptyText, { color: colors.muted }]}>
                            Try a different search term
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(_, i) => String(i)}
                        renderItem={renderItem}
                        contentContainerStyle={s.list}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, padding: Space.lg },

    pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginBottom: 2 },
    subtitle: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginBottom: Space.lg },

    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.sm,
        borderRadius: Radius.md,
        paddingHorizontal: Space.md,
        paddingVertical: 13,
        marginBottom: Space.lg,
        ...CardShadow,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Nunito_400Regular',
        fontSize: FontSize.base,
        padding: 0,
    },

    centered: { alignItems: 'center', paddingTop: 60 },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },
    emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginBottom: 4 },
    emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, textAlign: 'center' },

    list: { paddingBottom: 40 },

    card: {
        borderRadius: Radius.lg,
        marginBottom: Space.md,
        overflow: 'hidden',
        ...CardShadow,
    },
    cardImage: {
        width: '100%',
        height: 160,
    },
    cardImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: {
        padding: Space.md,
    },
    cardName: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: FontSize.md,
        marginBottom: 4,
    },
    cardPrice: {
        fontFamily: 'Poppins_700Bold',
        fontSize: FontSize.lg,
        marginBottom: 4,
    },
    cardSupplier: {
        fontFamily: 'Nunito_400Regular',
        fontSize: FontSize.sm,
        marginBottom: 4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    cardContact: {
        fontFamily: 'Nunito_400Regular',
        fontSize: FontSize.xs,
    },
});
