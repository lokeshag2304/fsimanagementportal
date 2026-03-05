"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Header } from "@/components/layout";
import { GlassCard, GlassButton } from "@/components/glass";
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal";
import { ImportModal } from "@/components/ImportModal";
import { HistoryModal } from "@/components/HistoryModal";

import {
  Edit,
  Trash2,
  Search,
  Plus,
  Calendar,
  DollarSign,
  Package,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Eye,
  Upload,
  History,
  Info,
} from "lucide-react";
import { RemarkHistory } from "@/components/RemarkHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { apiService } from "@/common/services/apiService";
import api from "@/lib/api";
import Pagination from "@/common/Pagination";
import DashboardLoader, { downloadBase64File } from "@/common/DashboardLoader";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import { ApiDropdown, glassSelectStyles } from "@/common/DynamicDropdown";
import { GlassSelect } from "@/components/glass/GlassSelect";
import { handleDateChangeLogic, getDaysToColor } from "@/utils/dateCalculations";
import { normalizeEntityPayload } from "@/utils/normalizePayload";
import { emitEntityChange } from "@/lib/entityBus";
import { formatLastUpdated } from "@/utils/dateFormatter";

interface Subscription {
  remark_id?: number | null;
  id: number;
  client_name: string | null;
  client_id: number;
  domain_name: string | null;
  product_name: string;
  product_id?: number;
  vendor_name: string | null;
  vendor_id?: number;
  renewal_date: string;
  amount: number | null;
  expiry_date: string;
  deletion_date?: string | null;
  days_to_delete?: number | null;
  days_to_expire_today: number;
  today_date: string;
  status: 0 | 1;
  latest_remark?: {
    id: number;
    remark: string;
  };
  updated_at: string;
  remarks: string;
  has_remark_history?: boolean;
}

interface AddEditSubscription {
  record_type: 1;
  id?: number;
  s_id: number;
  product_id: number;
  client_id: number;
  vendor_id: number;
  renewal_date: string;
  amount: number;
  expiry_date: string;
  deletion_date?: string;
  days_to_delete?: number;
  status: 0 | 1;
  remarks: string;
  product_name: string;
  vendor_name: string;
  remark_id: number;
}

interface ProductOption {
  id: number;
  product_name: string;
  product_description?: string;
}


const SubscriptionRow = React.memo(({
  item, index, startItem, selectedItems, editingId, highlightedRecordId, editData,
  handleSelectItem, handleEditChange, handleStatusSelect, getSelectedStatusOption,
  handleSave, handleCancelEdit, handleViewDetails, handleEdit, handleDeleteClick,
  loadingProducts, statusOptions, glassSelectStyles,
  getDaysToColor, calculateDays, formatDate, getProductNameById, isSaving,
  isClient // Added isClient prop
}: any) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  return (
    <>
      <tr
        key={item.id}
        className={`h-12 border-b border-white/5 transition-all duration-200 ${highlightedRecordId === item.id
          ? "bg-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]"
          : editingId === item.id
            ? "bg-blue-500/5 hover:bg-white/5"
            : "hover:bg-white/5"
          }`}
      >
        <td className="py-3 px-4">
          <input
            type="checkbox"
            checked={selectedItems.includes(item.id)}
            onChange={(e) =>
              handleSelectItem(item.id, e.target.checked)
            }
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
          />
        </td>
        <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
          {startItem + index}
          {(item as any).isNewRecord && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              New
            </span>
          )}
        </td>

        {editingId === item.id ? (
          <>
            <td className="py-3 px-4">
              {loadingProducts ? (
                <div className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-400">
                  Loading products...
                </div>
              ) : (
                <ApiDropdown
                  endpoint="get-products"
                  value={
                    editData[item.id]?.product_id
                      ? {
                        value:
                          editData[item.id]?.product_id ||
                          0,
                        label:
                          editData[item.id]
                            ?.product_name ||
                          getProductNameById(
                            editData[item.id]
                              ?.product_id || 0
                          ),
                      }
                      : null
                  }
                  onChange={(option) => {
                    handleEditChange(
                      item.id,
                      "product_id",
                      option?.value ?? null
                    );
                    handleEditChange(
                      item.id,
                      "product_name",
                      option?.label ?? ""
                    );
                  }}
                  placeholder="Product"
                />
              )}
            </td>
            {!isClient && (
              <td className="py-3 px-4">
                <ApiDropdown
                  endpoint="get-clients"
                  value={
                    editData[item.id]?.client_id
                      ? {
                        value:
                          editData[item.id]?.client_id ||
                          0,
                        label:
                          editData[item.id]
                            ?.client_name ||
                          getProductNameById(
                            editData[item.id]
                              ?.client_id || 0
                          ),
                      }
                      : null
                  }
                  onChange={(option) => {
                    handleEditChange(
                      item.id,
                      "client_id",
                      option?.value ?? null
                    );
                    handleEditChange(
                      item.id,
                      "client_name",
                      option?.label ?? ""
                    );
                  }}
                  placeholder="Client"
                />
              </td>
            )}

            <td className="py-3 px-4">
              <ApiDropdown
                endpoint="get-venders"
                value={
                  editData[item.id]?.vendor_id
                    ? {
                      value:
                        editData[item.id]?.vendor_id ||
                        0,
                      label:
                        editData[item.id]
                          ?.vendor_name ||
                        "",
                    }
                    : null
                }
                onChange={(option) => {
                  handleEditChange(
                    item.id,
                    "vendor_id",
                    option?.value ?? null
                  );
                  handleEditChange(
                    item.id,
                    "vendor_name",
                    option?.label ?? ""
                  );
                }}
                placeholder="Vendor"
              />
            </td>
            <td className="py-3 px-4">
              <input
                type="number"
                value={
                  editData[item.id]?.amount ||
                  item.amount ||
                  ""
                }
                onChange={(e) =>
                  handleEditChange(
                    item.id,
                    "amount",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                style={{ minHeight: "32px" }}
                min="0"
                step="0.01"
              />
            </td>
            <td className="py-3 px-4">
              <input
                type="date"
                value={
                  editData[item.id]?.expiry_date ||
                  item.expiry_date
                }
                onChange={(e) =>
                  handleEditChange(
                    item.id,
                    "expiry_date",
                    e.target.value
                  )
                }
                className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                style={{ minHeight: "32px" }}
              />
            </td>
            <td className="py-3 px-4 text-sm text-gray-300">
              <input
                type="number"
                value={calculateDays(editData[item.id]?.expiry_date || item.expiry_date)}
                readOnly
                className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-xs cursor-not-allowed"
                style={{ minHeight: '32px' }}
              />
            </td>
            <td className="py-3 px-4">
              <input
                type="date"
                value={
                  editData[item.id]?.deletion_date ??
                  item.deletion_date ??
                  ""
                }
                onChange={(e) => handleEditChange(item.id, "deletion_date", e.target.value)}
                className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                style={{ minHeight: "32px" }}
              />
            </td>
            <td className="py-3 px-4">
              <input
                type="number"
                value={
                  editData[item.id]?.days_to_delete ??
                  item.days_to_delete ??
                  ""
                }
                readOnly
                className={`w-32 px-3 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm outline-none focus:ring-0 cursor-not-allowed ${getDaysToColor(editData[item.id]?.days_to_delete ?? item.days_to_delete)}`}
              />
            </td>
          </>
        ) : (
          <>
            <td className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-white font-medium">
                  {item.product_name}
                </span>
              </div>
            </td>
            {!isClient && (
              <td className="py-3 px-4 text-sm text-gray-300">
                {item.client_name}
              </td>
            )}

            <td className="py-3 px-4 text-sm text-gray-300">
              {item.vendor_name || "--"}
            </td>
            <td className="py-3 px-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                {item.amount || "0.00"}
              </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-300">
              {item.renewal_date ? new Date(item.renewal_date).toLocaleDateString() : "--"}
            </td>
            <td className="py-3 px-4">
              <div className="inline-flex items-center whitespace-nowrap gap-1 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-gray-500/20 text-gray-400 border border-gray-500/20">
                {(item as any).days_left ?? 'N/A'}
              </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-300">
              {item.deletion_date ? new Date(item.deletion_date).toLocaleDateString() : "--"}
            </td>
            <td className="py-3 px-4 whitespace-nowrap">
              <span className="text-sm">
                {item.days_to_delete ?? '--'}
              </span>
            </td>
          </>
        )}


        {editingId === item.id ? (
          <td className="py-3 px-4">
            <div className="w-40">
              <GlassSelect
                options={statusOptions}
                value={getSelectedStatusOption()}
                onChange={handleStatusSelect}
                isSearchable={false}
                isClearable
                styles={glassSelectStyles}
              />
            </div>
          </td>
        ) : (
          <td className="py-3 px-4">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${item.status === 1
                ? "bg-green-500/20 text-green-400 border-green-500/20"
                : "bg-red-500/20 text-red-400 border-red-500/20"
                }`}
            >
              {item.status === 1 ? "Active" : "Inactive"}
            </div>
          </td>
        )}

        {editingId === item.id ? (
          <td className="py-3 px-4">
            <input
              type="text"
              value={
                editData[item.id]?.remarks ??
                item.remarks ??
                ""
              }
              onChange={(e) =>
                handleEditChange(
                  item.id,
                  "remarks",
                  e.target.value
                )
              }
              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
              style={{ minHeight: "32px" }}
            />
          </td>
        ) : (
          <td className="py-3 px-4">
            <div className="flex items-center gap-2 group">
              <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex flex-col gap-1 w-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 truncate max-w-[150px]">
                    {item.remarks || "--"}
                  </span>
                  {item.has_remark_history && (
                    <button
                      onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                      className={`p-1 rounded-full transition-all duration-300 ${isHistoryExpanded
                        ? "bg-blue-500/30 text-blue-300 rotate-180"
                        : "hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
                        }`}
                      title="Remark History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </td>
        )}

        <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
          {item.last_updated || formatLastUpdated(item.updated_at)}
        </td>

        <td className="py-3 px-4">
          <div
            className="flex items-center justify-end gap-2"
          >
            {editingId === item.id ? (
              <>
                <GlassButton
                  onClick={() => handleSave(item.id)}
                  disabled={isSaving}
                  className="p-1.5 min-w-0 bg-green-500/20 hover:bg-green-500/30"
                  title="Save"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                  ) : (
                    <Save className="w-4 h-4 text-green-400" />
                  )}
                </GlassButton>
                <GlassButton
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-1.5 min-w-0 bg-red-500/20 hover:bg-red-500/30"
                  title="Cancel"
                >
                  <X className="w-4 h-4 text-red-400" />
                </GlassButton>
              </>
            ) : (
              <>
                <GlassButton
                  onClick={() => handleViewDetails(item)}
                  className="p-1.5 min-w-0 hover:bg-blue-500/20"
                  title="View Details"
                >
                  <Eye className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" />
                </GlassButton>
                <GlassButton
                  onClick={() => handleEdit(item)}
                  className="p-1.5 min-w-0 hover:bg-white/10"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" />
                </GlassButton>
                <GlassButton
                  onClick={() => handleDeleteClick(item.id)}
                  className="p-1.5 min-w-0 hover:bg-red-500/20"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-400 transition-colors" />
                </GlassButton>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Remark History - Inline Stack Style */}
      {isHistoryExpanded && (
        <tr className="bg-blue-500/5 animate-in fade-in slide-in-from-top-4 duration-500">
          <td colSpan={13} className="py-0 px-4">
            <div className="border-t border-blue-500/20 py-4 pb-6 ml-12 mr-12">
              <RemarkHistory key={`history-${item.id}-${item.updated_at}`} module="Subscription" recordId={item.id} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

export default function SubscriptionsPage() {
  const { user, getToken } = useAuth()
  const token = getToken();
  const isClient = user?.role === "ClientAdmin" || user?.login_type === 3;
  const navigationTabs = getNavigationByRole(user?.role);

  const { toast } = useToast();
  const router = useRouter();

  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(null);

  const [newRecordData, setNewRecordData] = useState({
    product_id: "",
    product_name: "",
    client_id: "",
    client_name: "",
    vendor_id: "",
    vendor_name: "",
    renewal_date: "",
    amount: "",
    expiry_date: "",
    deletion_date: "",
    days_left: "",
    days_to_delete: "",
    days_to_delete_preview: "" as string | number,
    status: "1" as "1" | "0",
    remarks: "",
  });

  const [editData, setEditData] = useState<
    Record<number, Partial<Subscription> & { remark_id?: number | null }>
  >({});

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 100,
    orderBy: "id" as "id" | "renewal_date" | "amount" | "product_name",
    orderDir: "asc" as "asc" | "desc",
  });

  const [totalItems, setTotalItems] = useState(0);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);


  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const statusOptions = [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ];

  const getSelectedStatusOption = () => {
    return (
      statusOptions.find(
        (option) => option.value === newRecordData.status
      ) || null
    );
  };

  const handleStatusSelect = (selected: any) => {
    handleNewRecordChange(
      "status",
      selected?.value as "1" | "0"
    );
  };

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const limit = pagination.rowsPerPage;
      const offset = pagination.page * limit;
      const response = await api.get("secure/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset, search: searchQuery }
      });

      const raw = response.data;
      setData(Array.isArray(raw) ? raw : (raw?.data ?? []));
      if (raw?.total !== undefined) setTotalItems(raw.total);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.rowsPerPage, searchQuery]);

  const handleImportSuccess = async (response?: any) => {
    const inserted = response?.inserted ?? 0;
    const duplicates = response?.duplicates ?? 0;
    const failed = response?.failed ?? 0;
    const errs = response?.errors ?? [];

    // Always refetch to get correct server-sorted order
    await fetchSubscriptions();
    emitEntityChange('subscription', 'import', null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Toast for inserted records
    if (inserted > 0) {
      toast({
        title: "Import Successful",
        description: `${inserted} record(s) imported.`,
        variant: "default",
      });
    }

    // Toast for duplicates (neutral, not destructive)
    if (duplicates > 0) {
      toast({
        title: `${duplicates} duplicate(s) skipped`,
        description: "These records already exist in the database.",
        variant: "default",
      });
    }

    // Toast for actual failures only (bad date, missing field, etc.)
    if (failed > 0 && errs.length > 0) {
      const preview = errs.slice(0, 3).map((e: any) => e.reason || e.message).join(" • ");
      toast({
        title: `${failed} row(s) failed`,
        description: preview + (errs.length > 3 ? ` …and ${errs.length - 3} more` : ""),
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) fetchSubscriptions();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSubscriptions, token]);

  const processedData = useMemo(() => {
    return data;
  }, [data]);

  const paginatedData = useMemo(() => {
    return data;
  }, [data]);

  // Handle Add New
  const handleAddNew = () => {
    setAddingNew(true);
    setNewRecordData({
      product_id: "",
      product_name: "",
      client_id: isClient ? (user?.id as any) : "",
      client_name: isClient ? (user?.name || "") : "",
      vendor_id: "",
      vendor_name: "",
      renewal_date: "",
      amount: "",
      expiry_date: "",
      deletion_date: "",
      days_left: "",
      days_to_delete: "",
      days_to_delete_preview: "",
      status: "1",
      remarks: "",
    });
  };

  // Cancel Add New
  const handleCancelAdd = () => {
    setAddingNew(false);
  };

  // Get product name by ID
  const getProductNameById = (id: string | number) => {
    const product = products.find((p) => p.id === Number(id));
    return product?.product_name || "";
  };

  const handleSaveNew = async () => {
    try {
      setIsSaving(true);
      if (!newRecordData.product_id || !newRecordData.client_id || !newRecordData.vendor_id || !newRecordData.renewal_date) {
        toast({
          title: "Error",
          description: "Please fill all required fields (Product, Client, Vendor, Renewal Date)",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const payload = {
        ...normalizeEntityPayload(newRecordData),
        client_id: isClient ? user?.id : newRecordData.client_id,
        record_type: 1,

        s_id: user?.id || 0,
        amount: parseFloat(newRecordData.amount) || 0,
      };

      const response = await api.post("secure/subscriptions", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Use the returned record or build one optimistically
      const newRecord = response.data?.data || {
        ...payload,
        id: response.data?.id || Date.now(),
        client_name: newRecordData.client_name,
        product_name: newRecordData.product_name,
        isNewRecord: true,
      };

      setData((prev) => [newRecord, ...prev]);
      setTotalItems((prev) => prev + 1);
      emitEntityChange('subscription', 'create', newRecord);

      const newId = newRecord.id;
      setHighlightedRecordId(newId);
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => setHighlightedRecordId(null), 2000);

      toast({
        title: "Success",
        description: "Subscription added successfully",
        variant: "default",
      });

      setAddingNew(false);
      setNewRecordData({
        product_id: "",
        client_id: "",
        client_name: "",
        product_name: "",
        vendor_id: "",
        vendor_name: "",
        renewal_date: "",
        amount: "",
        expiry_date: "",
        deletion_date: "",
        days_left: "",
        days_to_delete: "",
        days_to_delete_preview: "",
        status: "1",
        remarks: "",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to add subscription",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);

      const payload: any = {
        record_type: 1,
        s_id: user?.id || 0,
      };

      const response = await apiService.exportRecord(payload, user, token);

      if ((response as any).success) {
        toast({
          title: "Success",
          description: response.data?.message || "Subscription exported successfully",
          variant: "default",
        });
        downloadBase64File(response.data.base64, response.data.filename);
      } else {
        toast({
          title: "Error",
          description: response.data?.message || response.message || "Failed to export subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting subscription:", error);
      toast({
        title: "Error",
        description: "Failed to export subscription",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Handle Edit - Clear previous edit data
  const handleEdit = (subscription: Subscription) => {
    console.log(subscription);
    setEditingId(subscription.id);
    setEditData({
      [subscription.id]: {
        ...subscription,
        product_id: subscription.product_id || 0,
        client_id: subscription.client_id || 0,
        vendor_id: subscription.vendor_id || 0,
        client_name: subscription.client_name || "",
        product_name: subscription.product_name || "",
        vendor_name: subscription.vendor_name || "",
        remarks: subscription.remarks || "",
        remark_id: null,
      },
    });
  };

  // Handle Save (inline editing)
  const handleSave = async (id: number) => {
    try {
      setIsSaving(true);
      const updatedData = editData[id];

      if (!updatedData) return;

      const productId =
        updatedData.product_id ||
        data.find((item) => item.id === id)?.product_id ||
        0;
      const productName =
        updatedData.product_name || getProductNameById(productId);

      const payload: any = {
        ...normalizeEntityPayload(updatedData),
        record_type: 1,
        id,
        s_id: user?.id || 0,
        amount: updatedData.amount || 0,
        remark_id: updatedData.remark_id || null,
      };

      const response = await api.put(`secure/subscriptions/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success || response.status === 200) {
        toast({
          title: "Success",
          description: response.data?.message || "Subscription updated successfully",
          variant: "default",
        });
        const updatedRecord = response.data?.data || {};
        setData((prev) =>
          prev.map((sub) => (sub.id === id ? { ...sub, ...payload, ...updatedRecord } : sub))
        );
        emitEntityChange('subscription', 'update', { id, ...payload, ...updatedRecord });
        setEditingId(null);
        setEditData({});
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to update subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Handle field change for new record
  const handleNewRecordChange = (
    field: keyof typeof newRecordData,
    value: any
  ) => {
    let daysPreview = newRecordData.days_to_delete_preview;

    if (field === "deletion_date") {
      daysPreview = value ? calculateDaysDifference(value) : "";
    }

    setNewRecordData((prev) => ({
      ...prev,
      [field]: value,
      days_to_delete_preview: daysPreview,
    }));
  };

  // Handle field change for editing
  const handleEditChange = (
    id: number,
    field: keyof Subscription,
    value: any
  ) => {
    setEditData((prev) => {
      const updatedItem = {
        ...prev[id],
        [field]: value,
      };

      if (field === "deletion_date") {
        updatedItem.days_to_delete = value ? calculateDaysDifference(value) as any : "";
      }

      return {
        ...prev,
        [id]: updatedItem,
      };
    });
  };

  // Handle Delete
  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one subscription",
        variant: "destructive",
      });
      return;
    }
    setItemToDelete(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems;

      let deleteSuccessCount = 0;
      let deleteErrorMsg = "";
      for (const delId of idsToDelete) {
        try {
          const res = await api.delete(`secure/subscriptions/${delId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.data?.success || res.status === 200 || res.status === 204) deleteSuccessCount++;
        } catch (e: any) {
          deleteErrorMsg = e.response?.data?.message || "Error deleting";
        }
      }
      const deleteResult = {
        status: deleteSuccessCount > 0,
        message: deleteSuccessCount > 0 ? `Successfully deleted ${deleteSuccessCount} record(s)` : deleteErrorMsg
      };

      if (deleteResult.status) {
        toast({
          title: "Success",
          description: deleteResult.message || "Record(s) deleted successfully",
          variant: "default",
        });

        setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
        setTotalItems((prev) => prev - idsToDelete.length);
        setSelectedItems([]);
        setItemToDelete(null);
        emitEntityChange('subscription', 'delete', idsToDelete);
      } else {
        toast({
          title: "Error",
          description: deleteResult.message || "Failed to delete record(s)",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete record(s)",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Handle Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;

  const getStatusColor = (status: 0 | 1) => {
    return status === 1 ? "text-green-400" : "text-red-400";
  };

  const getStatusText = (status: 0 | 1) => {
    return status === 1 ? "Active" : "Inactive";
  };

  const getStatusIcon = (status: 0 | 1) => {
    return status === 1 ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    );
  };

  const parseSafeDate = (dateStr: string) => {
    if (!dateStr) return null;
    let convertedStr = dateStr;
    const dmyMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmyMatch) {
      convertedStr = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }
    const d = new Date(convertedStr);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || dateString === "--") return "--";

    // If it already looks like our target format, preserve it
    if (typeof dateString === 'string' && dateString.includes(',') && dateString.includes(':')) {
      return dateString;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const calculateDays = (expiryDate: string | null | undefined) => {
    try {
      if (!expiryDate) return "";
      const expiry = parseSafeDate(expiryDate);
      if (!expiry) return "";

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);

      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) ? "" : diffDays;
    } catch {
      return "";
    }
  };

  const calculateDaysDifference = (date: string) => {
    if (!date) return "";
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let target = parseSafeDate(date);
      if (!target) {
        // Try direct construction if parseSafeDate fails or returns null
        target = new Date(date);
      }

      if (isNaN(target.getTime())) return "";

      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return "";

      return diffDays;
    } catch (e) {
      return "";
    }
  };

  const startItem = pagination.page * pagination.rowsPerPage + 1;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Handle View Details (redirect to details page)
  const handleViewDetails = (item: Subscription) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Product ID not found",
        variant: "destructive",
      });
      return;
    }

    // Redirect to details page with recordType and recordId
    router.push(`/${user?.role}/categaries-details/${item.id}?recordType=1`);
  };

  return (
    <div className="min-h-screen pb-8">
      <Header title="Subscription Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-[#BC8969]" />
                <h2 className="text-xl font-semibold text-white">
                  Subscriptions
                </h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your subscriptions and renewals
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all"
                />
              </div>

              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <GlassButton
                    variant="danger"
                    onClick={handleBulkDeleteClick}
                    className="flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete ({selectedItems.length})
                  </GlassButton>
                )}

                {!addingNew && (
                  <GlassButton
                    variant="primary"
                    onClick={handleAddNew}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subscription
                  </GlassButton>
                )}
                <GlassButton
                  variant="primary"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                  disabled={exportLoading}
                >
                  {exportLoading ? ("Exporting...") : (" Export")}
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </GlassButton>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="px-4 py-2 bg-gray-800 text-white rounded flex items-center gap-2 transition-colors hover:bg-gray-700 font-medium text-sm"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
                <ImportModal
                  recordType={1}
                  title="Import Subscriptions"
                  isOpen={isImportOpen}
                  setIsOpen={setIsImportOpen}
                  onSuccess={handleImportSuccess}
                  module="subscriptions"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-gray-800/50">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="py-3 px-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-14">
                      S.NO
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[130px]">
                      Product
                    </th>
                    {!isClient && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                        Client
                      </th>
                    )}
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px] w-32">
                      Vendor
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px] w-24">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Renewal Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
                      Days Left
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Deletion Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
                      Days to Delete
                    </th>

                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Remarks
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Last Updated
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[160px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Fetch Subscriptions..." />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Add New Row */}
                      {addingNew && (
                        <tr className="border-b border-white/5 bg-blue-500/5">
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            New
                          </td>
                          <td className="py-3 px-4">
                            {loadingProducts ? (
                              <div className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-400">
                                Loading products...
                              </div>
                            ) : (
                              <ApiDropdown
                                label=""
                                endpoint="get-products"
                                value={
                                  newRecordData.product_id
                                    ? {
                                      value: Number(newRecordData.product_id) as any,
                                      label: newRecordData.product_name,
                                    }
                                    : null
                                }
                                onChange={(option) => {
                                  handleNewRecordChange(
                                    "product_id",
                                    option?.value ?? null
                                  );
                                  handleNewRecordChange(
                                    "product_name",
                                    option?.label ?? ""
                                  );
                                }}
                                placeholder="Product"
                              />
                            )}
                          </td>
                          {!isClient && (
                            <td className="py-3 px-4">
                              <ApiDropdown
                                label=""
                                endpoint="get-clients"
                                value={
                                  newRecordData.client_id
                                    ? {
                                      value: Number(newRecordData.client_id) as any,
                                      label: newRecordData.client_name,
                                    }
                                    : null
                                }
                                onChange={(option) => {
                                  handleNewRecordChange(
                                    "client_id",
                                    option?.value ?? null
                                  );
                                  handleNewRecordChange(
                                    "client_name",
                                    option?.label ?? ""
                                  );
                                }}
                                placeholder="Client"
                              />
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <ApiDropdown
                              label=""
                              endpoint="get-venders"
                              value={
                                newRecordData.vendor_id
                                  ? {
                                    value: Number(newRecordData.vendor_id) as any,
                                    label: newRecordData.vendor_name,
                                  }
                                  : null
                              }
                              onChange={(option) => {
                                handleNewRecordChange(
                                  "vendor_id",
                                  option?.value ?? null
                                );
                                handleNewRecordChange(
                                  "vendor_name",
                                  option?.label ?? ""
                                );
                              }}
                              placeholder="Vendor"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={newRecordData.amount}
                              onChange={(e) =>
                                handleNewRecordChange("amount", e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.renewal_date}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "renewal_date",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            <input
                              type="number"
                              value={calculateDays(newRecordData.renewal_date)}
                              readOnly
                              className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-xs cursor-not-allowed"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.deletion_date}
                              onChange={(e) => handleNewRecordChange("deletion_date", e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={newRecordData.days_to_delete_preview}
                              readOnly
                              className={`w-32 px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm outline-none focus:ring-0 cursor-not-allowed ${getDaysToColor(newRecordData.days_to_delete_preview)}`}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-40">
                              <GlassSelect
                                options={statusOptions}
                                value={getSelectedStatusOption()}
                                onChange={handleStatusSelect}
                                isSearchable={false}
                                isClearable
                                styles={glassSelectStyles}
                              />
                            </div>

                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={newRecordData.remarks}
                              onChange={(e) =>
                                handleNewRecordChange("remarks", e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                              placeholder="Remarks"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            --
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <GlassButton
                                onClick={handleSaveNew}
                                disabled={isSaving}
                                className="p-1.5 min-w-0 bg-green-500/20 hover:bg-green-500/30"
                                title="Save"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                                ) : (
                                  <Save className="w-4 h-4 text-green-400" />
                                )}
                              </GlassButton>
                              <GlassButton
                                onClick={handleCancelAdd}
                                disabled={isSaving}
                                className="p-1.5 min-w-0 bg-red-500/20 hover:bg-red-500/30"
                                title="Cancel"
                              >
                                <X className="w-4 h-4 text-red-400" />
                              </GlassButton>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Existing Data Rows */}
                      {data.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-8 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Package className="w-12 h-12 text-gray-400" />
                              <span className="text-gray-400">
                                No subscriptions found
                              </span>
                              {searchQuery && (
                                <button
                                  onClick={() => setSearchQuery("")}
                                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  Clear search
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((item, index) => (
                          <SubscriptionRow
                            key={`${item.id}-${index}`}
                            item={item}
                            index={index}
                            startItem={startItem}
                            selectedItems={selectedItems}
                            editingId={editingId}
                            highlightedRecordId={highlightedRecordId}
                            editData={editData}
                            handleSelectItem={handleSelectItem}
                            handleEditChange={handleEditChange}
                            handleStatusSelect={handleStatusSelect}
                            getSelectedStatusOption={getSelectedStatusOption}
                            handleSave={handleSave}
                            handleCancelEdit={handleCancelEdit}
                            handleViewDetails={handleViewDetails}
                            handleEdit={handleEdit}
                            handleDeleteClick={handleDeleteClick}
                            loadingProducts={loadingProducts}
                            statusOptions={statusOptions}
                            glassSelectStyles={glassSelectStyles}
                            getDaysToColor={getDaysToColor}
                            calculateDays={calculateDays}
                            formatDate={formatDate}
                            getProductNameById={getProductNameById}
                            isSaving={isSaving}
                            isClient={isClient}
                          />
                        ))
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && data.length > 0 && (
              <Pagination
                page={pagination.page}
                rowsPerPage={pagination.rowsPerPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedItems.length} subscription
                  {selectedItems.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItems([])}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={handleBulkDeleteClick}
                    disabled={isDeleting}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {isDeleting
                      ? "Deleting..."
                      : `Delete ${selectedItems.length} items`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemCount={itemToDelete ? 1 : selectedItems.length}
        isLoading={isDeleting}
        title={
          itemToDelete ? "Delete Subscription" : "Delete Multiple Subscriptions"
        }
        message={
          itemToDelete
            ? "Are you sure you want to delete this subscription? This action cannot be undone."
            : "Are you sure you want to delete the selected subscriptions? This action cannot be undone."
        }
      />

      {/* History Modal */}
      <HistoryModal
        entity="subscription"
        isOpen={isHistoryOpen}
        setIsOpen={setIsHistoryOpen}
      />
    </div>
  );
}
