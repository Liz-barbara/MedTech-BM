const NEON_API_URL = import.meta.env.VITE_NEON_DATA_API_URL;
const NEON_API_KEY = import.meta.env.VITE_NEON_API_KEY || ''; // Opcional, caso exija token Bearer

function getHeaders(preferReturn = false) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (NEON_API_KEY) {
    headers['Authorization'] = `Bearer ${NEON_API_KEY}`;
  }
  if (preferReturn) {
    headers['Prefer'] = 'return=representation';
  }
  return headers;
}

export const neonDb = {
  from(table) {
    const baseUrl = `${NEON_API_URL}/${table}`;

    return {
      // SELECT com suporte a filtros .eq() e .maybeSingle()
      select(columns = '*') {
        const filters = [`select=${encodeURIComponent(columns)}`];
        let isSingle = false;

        const builder = {
          eq(column, value) {
            filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
            return builder;
          },
          maybeSingle() {
            isSingle = true;
            filters.push('limit=1');
            return builder;
          },
          async then(resolve, reject) {
            try {
              const res = await fetch(`${baseUrl}?${filters.join('&')}`, {
                method: 'GET',
                headers: getHeaders(),
              });
              if (!res.ok) {
                const errText = await res.text();
                return resolve({ data: null, error: new Error(errText || res.statusText) });
              }
              const json = await res.json();
              const data = isSingle ? (json[0] || null) : json;
              resolve({ data, error: null });
            } catch (error) {
              if (reject) reject(error);
              else resolve({ data: null, error });
            }
          },
        };

        return builder;
      },

      // INSERT com suporte a .select().single()
      insert(rows) {
        let returnData = false;
        let singleRow = false;

        const builder = {
          select() {
            returnData = true;
            return builder;
          },
          single() {
            singleRow = true;
            return builder;
          },
          async then(resolve, reject) {
            try {
              const res = await fetch(baseUrl, {
                method: 'POST',
                headers: getHeaders(returnData),
                body: JSON.stringify(rows),
              });
              if (!res.ok) {
                const errText = await res.text();
                return resolve({ data: null, error: new Error(errText || res.statusText) });
              }
              if (!returnData) {
                return resolve({ data: null, error: null });
              }
              const json = await res.json();
              resolve({ data: singleRow ? json[0] : json, error: null });
            } catch (error) {
              if (reject) reject(error);
              else resolve({ data: null, error });
            }
          },
        };

        return builder;
      },

      // UPDATE com filtro .eq()
      update(values) {
        const filters = [];

        const builder = {
          eq(column, value) {
            filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
            return builder;
          },
          async then(resolve, reject) {
            try {
              const query = filters.length ? `?${filters.join('&')}` : '';
              const res = await fetch(`${baseUrl}${query}`, {
                method: 'PATCH',
                headers: getHeaders(false),
                body: JSON.stringify(values),
              });
              if (!res.ok) {
                const errText = await res.text();
                return resolve({ data: null, error: new Error(errText || res.statusText) });
              }
              resolve({ data: null, error: null });
            } catch (error) {
              if (reject) reject(error);
              else resolve({ data: null, error });
            }
          },
        };

        return builder;
      },
    };
  },
};