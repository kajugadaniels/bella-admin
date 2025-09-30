/* ========================================================================
   API Client for Bella (Auth + Superadmin modules)
   ======================================================================== */

function normalizeApiBase(raw) {
	const v = String(raw || '').trim();
	if (!v) return '';
	if (/^https?:\/\//i.test(v)) return v.replace(/\/+$/, '');
	return `https://${v.replace(/\/+$/, '')}`;
}

const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
export const API_BASE = normalizeApiBase(RAW_BASE);

(function assertAbsolute() {
	if (!/^https?:\/\//i.test(API_BASE)) {
		console.error('[API] VITE_API_BASE_URL is not absolute.', RAW_BASE, '=>', API_BASE);
		throw new Error(
			'Invalid VITE_API_BASE_URL. It must be an absolute URL, e.g. https://bella-erp-api.example.com/api'
		);
	}
})();

export const TOKENS_MODE = (import.meta.env.VITE_AUTH_TOKENS_MODE || 'localstorage').toLowerCase();

const ACCESS_KEY = 'bella_access';
const REFRESH_KEY = 'bella_refresh';

export function setTokens(tokens = {}) {
	if (tokens.access) localStorage.setItem(ACCESS_KEY, tokens.access);
	if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
}
export function getTokens() {
	return {
		access: localStorage.getItem(ACCESS_KEY) || '',
		refresh: localStorage.getItem(REFRESH_KEY) || '',
	};
}
export function clearTokens() {
	localStorage.removeItem(ACCESS_KEY);
	localStorage.removeItem(REFRESH_KEY);
}
function authHeaders() {
	const { access } = getTokens();
	return access ? { Authorization: `Bearer ${access}` } : {};
}
function url(path) {
	const p = String(path || '');
	return `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;
}
function toQuery(params = {}) {
	const qs = new URLSearchParams();
	Object.entries(params || {}).forEach(([k, v]) => {
		if (v === undefined || v === null) return;
		if (Array.isArray(v)) {
			v.forEach((item) => {
				if (item === undefined || item === null || item === '') return;
				qs.append(k, String(item));
			});
			return;
		}
		if (v === '' && v !== 0) return;
		if (typeof v === 'boolean') qs.set(k, v ? 'true' : 'false');
		else qs.set(k, String(v));
	});
	const s = qs.toString();
	return s ? `?${s}` : '';
}
function isFileLike(x) {
	return (typeof File !== 'undefined' && x instanceof File) || (typeof Blob !== 'undefined' && x instanceof Blob);
}
function toFormData(payload = {}) {
	const fd = new FormData();
	Object.entries(payload || {}).forEach(([k, v]) => {
		if (v === undefined || v === null) return;
		if (isFileLike(v)) fd.append(k, v);
		else if (Array.isArray(v) || (typeof v === 'object' && v !== null)) fd.append(k, JSON.stringify(v));
		else fd.append(k, String(v));
	});
	return fd;
}
function maybeMultipart(payload) {
	if (!payload || typeof payload !== 'object') return payload;
	const hasFile = Object.values(payload).some((v) => isFileLike(v));
	return hasFile ? toFormData(payload) : payload;
}

function extractMessage(json) {
	if (!json || typeof json !== 'object') return undefined;
	if (typeof json.message === 'string' && json.message.trim()) return json.message;
	if (typeof json.detail === 'string' && json.detail.trim()) return json.detail;
	if (json.errors && typeof json.errors === 'object') {
		for (const k of Object.keys(json.errors)) {
			const v = json.errors[k];
			if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
			if (typeof v === 'string') return v;
		}
	}
	return undefined;
}
function extractDetailsList(json) {
	const list = [];
	if (!json || typeof json !== 'object') return list;
	if (json.errors && Array.isArray(json.errors.detail)) {
		json.errors.detail.forEach((s) => typeof s === 'string' && list.push(s));
	}
	if (json.errors && typeof json.errors === 'object') {
		for (const [k, v] of Object.entries(json.errors)) {
			if (k === 'detail') continue;
			if (Array.isArray(v)) v.forEach((s) => typeof s === 'string' && list.push(`${k}: ${s}`));
			else if (typeof v === 'string') list.push(`${k}: ${v}`);
		}
	}
	if (!list.length && typeof json.detail === 'string' && json.detail.trim()) list.push(json.detail);
	return list;
}

/**
 * @template T
 * @returns {Promise<{ ok: true, status: number, data: T, message?: string, headers: Record<string,string> } | never>}
 */
export async function apiRequest(path, opts = {}) {
	const { method = 'GET', body, headers = {}, auth = false, timeout = 20000 } = opts;
	const ac = new AbortController();
	const timer = setTimeout(() => ac.abort(), timeout);
	const finalUrl = url(path);

	const baseHeaders = { Accept: 'application/json', ...(auth ? authHeaders() : {}), ...headers };
	let payload;
	const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
	if (body !== undefined) {
		if (isForm) payload = body;
		else {
			baseHeaders['Content-Type'] = 'application/json';
			payload = JSON.stringify(body);
		}
	}

	let res;
	try {
		res = await fetch(finalUrl, {
			method,
			headers: baseHeaders,
			body: payload,
			signal: ac.signal,
			credentials: TOKENS_MODE === 'cookie' ? 'include' : 'omit',
		});
	} catch (err) {
		clearTimeout(timer);
		throw {
			ok: false,
			status: 0,
			message:
				err?.name === 'AbortError'
					? 'Request timed out. Please try again.'
					: 'Network error. Please check your connection.',
			details: [],
		};
	} finally {
		clearTimeout(timer);
	}

	const contentType = res.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

	if (res.ok) {
		if (data && typeof data === 'object' && data.tokens && (data.tokens.access || data.tokens.refresh))
			setTokens(data.tokens);
		const headersObj = {};
		try {
			for (const [k, v] of res.headers.entries()) headersObj[k.toLowerCase()] = v;
		} catch {}
		return { ok: true, status: res.status, data, message: extractMessage(data), headers: headersObj };
	}

	throw {
		ok: false,
		status: res.status,
		message: extractMessage(data) || `Request failed with status ${res.status}`,
		errors: (data && data.errors) || undefined,
		details: extractDetailsList(data),
		data,
	};
}

const GET = (path, opts = {}) => apiRequest(path, { ...opts, method: 'GET' });
const POST = (path, body, opts = {}) => apiRequest(path, { ...opts, method: 'POST', body });
const PATCH = (path, body, opts = {}) => apiRequest(path, { ...opts, method: 'PATCH', body });
const DELETE = (path, opts = {}) => apiRequest(path, { ...opts, method: 'DELETE' });

export const endpoints = {
	// Auth
	authRegisterRequest: '/auth/register/request/',
	authRegisterConfirm: '/auth/register/confirm/',
	authLogin: '/auth/login/',
	authLogout: '/auth/logout/',
	authLogoutAll: '/auth/logout/all/',
	authProfile: '/auth/profile/',
	authChangePassword: '/auth/password/change/',
	authPasswordResetRequest: '/auth/password/reset/request/',
	authPasswordResetConfirm: '/auth/password/reset/confirm/',

	// Superadmin
	saStoresList: '/superadmin/stores/',
	saStoreCreate: '/superadmin/store/add/',
	saStoreDetail: (storeId) => `/superadmin/store/${storeId}/`,
	saStoreUpdate: (storeId) => `/superadmin/store/${storeId}/update/`,
	saStoreDelete: (storeId) => `/superadmin/store/${storeId}/delete/`,
	saStoreStaffAdd: (storeId) => `/superadmin/store/${storeId}/staff/add/`,
	saStoreStaffDelete: (storeId, staffId) => `/superadmin/store/${storeId}/staff/${staffId}/`,

	saProductsViaStockIn: '/superadmin/products/',
	saProductDetail: (productId) => `/superadmin/product/${productId}/`,
	saProductCreateWithStockIn: '/superadmin/product/add/',
	saProductUpdate: (productId) => `/superadmin/product/${productId}/update/`,
	saStockInDetail: (stockinId) => `/superadmin/stockin/${stockinId}/`,
	saStockInVoid: (stockinId) => `/superadmin/stockin/${stockinId}/void/`,
	saStockInDelete: (stockinId) => `/superadmin/stockin/${stockinId}/delete/`,
	saProductPublishSingle: (productId) => `/superadmin/product/${productId}/publish/`,
	saProductsPublish: '/superadmin/products/publish/',
	saProductCategories: '/superadmin/product-categories/',

	saStoreMembersList: '/superadmin/store-members/',
	saStoreMemberDetail: (membershipId) => `/superadmin/store-member/${membershipId}/`,
	saStoreMemberDelete: (membershipId) => `/superadmin/store-member/${membershipId}/delete/`,

	// Clients
	saClientsList: '/superadmin/clients/',
	saClientDetail: (clientId) => `/superadmin/client/${clientId}/`,
	saClientDelete: (clientId) => `/superadmin/client/${clientId}/delete/`,

	// Admins
	saAdminsList: '/superadmin/admins/',
	saAdminDetail: (adminId) => `/superadmin/admin/${adminId}/`,
	saAdminDelete: (adminId) => `/superadmin/admin/${adminId}/delete/`,

	// Orders (NEW)
	saOrdersList: '/superadmin/orders/',
	saOrderDetail: (orderId) => `/superadmin/orders/${orderId}/`,
};

export const auth = {
	registerRequest(payload) {
		return POST(endpoints.authRegisterRequest, payload, { auth: false });
	},
	registerConfirm(payload) {
		return POST(endpoints.authRegisterConfirm, payload, { auth: false });
	},
	login(payload) {
		return POST(endpoints.authLogin, payload, { auth: false });
	},
	async logout(payload = {}) {
		const body = { refresh: payload.refresh || getTokens().refresh };
		const res = await POST(endpoints.authLogout, body, { auth: true });
		clearTokens();
		return res;
	},
	async logoutAll() {
		const res = await POST(endpoints.authLogoutAll, {}, { auth: true });
		clearTokens();
		return res;
	},
	getProfile() {
		return GET(endpoints.authProfile, { auth: true });
	},
	updateProfile(data) {
		return PATCH(endpoints.authProfile, data, { auth: true });
	},
	changePassword(payload) {
		return POST(endpoints.authChangePassword, payload, { auth: true });
	},
	passwordResetRequest(payload) {
		return POST(endpoints.authPasswordResetRequest, payload, { auth: false });
	},
	passwordResetConfirm(payload) {
		return POST(endpoints.authPasswordResetConfirm, payload, { auth: false });
	},
};

export const superadmin = {
	listStores(params = {}) {
		return GET(`${endpoints.saStoresList}${toQuery(params)}`, { auth: true });
	},
	createStore(payload) {
		const body = payload instanceof FormData ? payload : maybeMultipart(payload);
		return POST(endpoints.saStoreCreate, body, { auth: true });
	},
	getStore(storeId) {
		return GET(endpoints.saStoreDetail(storeId), { auth: true });
	},
	updateStore(storeId, payload) {
		const body = payload instanceof FormData ? payload : maybeMultipart(payload);
		return PATCH(endpoints.saStoreUpdate(storeId), body, { auth: true });
	},
	deleteStore(storeId) {
		return DELETE(endpoints.saStoreDelete(storeId), { auth: true });
	},
	addStoreStaff(storeId, payload) {
		return POST(endpoints.saStoreStaffAdd(storeId), payload, { auth: true });
	},

	listProductsViaStockIn(params = {}) {
		return GET(`${endpoints.saProductsViaStockIn}${toQuery(params)}`, { auth: true });
	},
	getProductDetail(productId, params = {}) {
		return GET(`${endpoints.saProductDetail(productId)}${toQuery(params)}`, { auth: true });
	},
	createProductWithStockIn(payload) {
		const body = payload instanceof FormData ? payload : maybeMultipart(payload);
		return POST(endpoints.saProductCreateWithStockIn, body, { auth: true });
	},
	updateProduct(productId, payload) {
		const body = payload instanceof FormData ? payload : maybeMultipart(payload);
		return PATCH(endpoints.saProductUpdate(productId), body, { auth: true });
	},

	getStockInDetail(stockinId, params = {}) {
		return GET(`${endpoints.saStockInDetail(stockinId)}${toQuery(params)}`, { auth: true });
	},
	voidStockIn(stockinId, body) {
		return PATCH(endpoints.saStockInVoid(stockinId), body, { auth: true });
	},
	deleteStockIn(stockinId, opts = {}) {
		const q = toQuery({ cascade: !!opts.cascade });
		return DELETE(`${endpoints.saStockInDelete(stockinId)}${q}`, { auth: true });
	},

	publishProduct(productId) {
		return PATCH(endpoints.saProductPublishSingle(productId), {}, { auth: true });
	},
	publishProducts(ids, strict = false) {
		return PATCH(endpoints.saProductsPublish, { ids, strict }, { auth: true });
	},
	getProductCategories() {
		return GET(endpoints.saProductCategories, { auth: true });
	},

	listStoreMembers(params = {}) {
		return GET(`${endpoints.saStoreMembersList}${toQuery(params)}`, { auth: true });
	},
	getStoreMember(membershipId, params = {}) {
		return GET(`${endpoints.saStoreMemberDetail(membershipId)}${toQuery(params)}`, { auth: true });
	},
	deleteStoreMember(membershipId, opts = {}) {
		const q = toQuery({ allow_last_admin: !!opts.allow_last_admin });
		return DELETE(`${endpoints.saStoreMemberDelete(membershipId)}${q}`, { auth: true });
	},

	listClients(params = {}) {
		return GET(`${endpoints.saClientsList}${toQuery(params)}`, { auth: true });
	},
	getClient(clientId, params = {}) {
		return GET(`${endpoints.saClientDetail(clientId)}${toQuery(params)}`, { auth: true });
	},
	deleteClient(clientId) {
		return DELETE(endpoints.saClientDelete(clientId), { auth: true });
	},

	listAdmins(params = {}) {
		return GET(`${endpoints.saAdminsList}${toQuery(params)}`, { auth: true });
	},
	getAdmin(adminId, params = {}) {
		return GET(`${endpoints.saAdminDetail(adminId)}${toQuery(params)}`, { auth: true });
	},
	deleteAdmin(adminId) {
		return DELETE(endpoints.saAdminDelete(adminId), { auth: true });
	},

	// Orders (NEW)
	listOrders(params = {}) {
		return GET(`${endpoints.saOrdersList}${toQuery(params)}`, { auth: true });
	},
	getOrderDetail(orderId) {
		return GET(endpoints.saOrderDetail(orderId), { auth: true });
	},
};

export default {
	API_BASE,
	TOKENS_MODE,
	endpoints,
	apiRequest,
	setTokens,
	getTokens,
	clearTokens,
	auth,
	superadmin,
};
