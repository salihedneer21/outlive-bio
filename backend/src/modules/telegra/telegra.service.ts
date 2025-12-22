import { env } from '@config/env';

export interface TelegraProductVariation {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  affiliate?: string | null;
  medication?: {
    name: string;
    activeIngredient?: string;
    strength?: string;
    form?: string;
  };
}

interface TelegraAuthResponse {
  token: string;
  user: {
    affiliate: string;
    [key: string]: unknown;
  };
}

const getTelegraCredentials = () => {
  const { TELEGRA_EMAIL, TELEGRA_PASSWORD, TELEGRA_BASE_URL } = env;

  if (!TELEGRA_EMAIL || !TELEGRA_PASSWORD || !TELEGRA_BASE_URL) {
    throw new Error('Telegra credentials are not configured');
  }

  return {
    email: TELEGRA_EMAIL,
    password: TELEGRA_PASSWORD,
    baseUrl: TELEGRA_BASE_URL
  };
};

const getTelegraToken = async (): Promise<{ token: string; affiliateId: string }> => {
  const { email, password, baseUrl } = getTelegraCredentials();

  const credentials = Buffer.from(`${email}:${password}`).toString('base64');

  const response = await fetch(`${baseUrl}/auth/client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegra auth failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as TelegraAuthResponse;

  if (!data.user?.affiliate) {
    throw new Error('Telegra auth response missing affiliate id');
  }

  return {
    token: data.token,
    affiliateId: data.user.affiliate
  };
};

const normalizeProductData = (data: unknown, affiliateId: string): TelegraProductVariation[] => {
  const asArray = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : value ? [value] : [];

  const normalizeArray = (items: unknown[]): TelegraProductVariation[] => {
    return items.flatMap((item) => {
      const product = item as any;

      // If productVariations exist, expand them
      if (Array.isArray(product.productVariations)) {
        return product.productVariations.map((variation: any) => ({
          _id: variation._id || variation.id,
          name:
            `${product.title || product.name || 'Product'} - ${
              variation.description || variation.strength || 'Variation'
            }`,
          description:
            variation.description ||
            `${variation.strength || ''} ${variation.form || ''}`.trim() ||
            product.description,
          affiliate: affiliateId,
          medication: {
            name: product.title || product.name || 'Unknown',
            activeIngredient: product.title || product.name || 'Unknown',
            strength: variation.strength || 'N/A',
            form: variation.form || 'Unknown'
          }
        }));
      }

      // Direct product
      return [
        {
          _id: product._id || product.id,
          name: product.title || product.name || product.description || 'Unknown Product',
          description: product.description || product.title || product.name,
          affiliate: affiliateId,
          medication: {
            name: product.title || product.name || product.description || 'Unknown',
            activeIngredient: product.title || product.name || product.description || 'Unknown',
            strength: product.strength || 'N/A',
            form: product.form || 'Unknown'
          }
        }
      ];
    });
  };

  if (Array.isArray(data)) {
    return normalizeArray(data);
  }

  const obj = data as any;

  if (Array.isArray(obj?.products)) {
    return normalizeArray(obj.products);
  }
  if (Array.isArray(obj?.productVariations)) {
    return normalizeArray(obj.productVariations);
  }
  if (Array.isArray(obj?.data)) {
    return normalizeArray(obj.data);
  }
  if (Array.isArray(obj?.results)) {
    return normalizeArray(obj.results);
  }

  return normalizeArray(asArray(data));
};

const fetchAffiliateProducts = async (
  token: string,
  affiliateId: string
): Promise<TelegraProductVariation[]> => {
  const { baseUrl } = getTelegraCredentials();

  const endpoints = [
    `/affiliates/${affiliateId}/productVariations`,
    `/affiliates/${affiliateId}/products`,
    `/productVariations?affiliate=${affiliateId}`,
    `/products?affiliate=${affiliateId}`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const products = normalizeProductData(data, affiliateId);

      if (products.length > 0) {
        return products;
      }
    } catch {
      // try next endpoint
      continue;
    }
  }

  return [];
};

export const testTelegraConnection = async (): Promise<{
  success: boolean;
  message: string;
  affiliateId?: string;
}> => {
  try {
    const { token, affiliateId } = await getTelegraToken();

    if (!token) {
      throw new Error('Failed to obtain Telegra token');
    }

    return {
      success: true,
      message: 'Successfully connected to Telegra API',
      affiliateId
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getTelegraProductVariations = async (): Promise<{
  products: TelegraProductVariation[];
  affiliateId?: string;
}> => {
  const { token, affiliateId } = await getTelegraToken();

  const products = await fetchAffiliateProducts(token, affiliateId);

  return {
    products,
    affiliateId
  };
};

export const getTelegraProductVariationById = async (
  id: string
): Promise<TelegraProductVariation | null> => {
  const { products } = await getTelegraProductVariations();
  return products.find((p) => p._id === id) ?? null;
};

