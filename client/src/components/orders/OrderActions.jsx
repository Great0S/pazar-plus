import logger from "../../utils/logger";
/**
 * Order Actions Component - Handles all order operations
 * Follows Pazar+ Design System patterns for buttons and actions
 */

import React, { useState, useCallback } from "react";

import {
  CheckCircle,
  Edit,
  Eye,
  MoreHorizontal,
  Printer,
  FileText,
  Ban,
  Trash2,
  ChevronDown,
} from "lucide-react";
import CancelOrderDialog from "../dialogs/CancelOrderDialog";
import { DropdownMenu } from "../ui";
import api from "../../services/api";
import enhancedPDFService from "../../services/enhancedPDFService";
import qnbFinansService from "../../services/qnbFinansService";

const OrderActions = ({
  order,
  onView,
  onEdit,
  onViewDetail,
  onAccept,
  onCancel,
  onDelete,
  showAlert,
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isPrintingShippingSlip, setIsPrintingShippingSlip] = useState(false);
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);

  // Enhanced print shipping slip using new service
  const handlePrintShippingSlip = useCallback(
    async (orderId) => {
      logger.info(
        "🚀 Enhanced handlePrintShippingSlip called with orderId:",
        orderId
      );

      if (isPrintingShippingSlip) {
        logger.info("⚠️ Already printing, ignoring request");
        return;
      }

      if (!orderId) {
        logger.info("❌ No orderId provided");
        showAlert("Sipariş kimliği eksik", "error");
        return;
      }

      setIsPrintingShippingSlip(true);

      try {
        // Get default template ID
        let defaultTemplateId = null;
        try {
          const defaultTemplateResponse =
            await api.shipping.getDefaultTemplate();
          if (defaultTemplateResponse.success && defaultTemplateResponse.data) {
            defaultTemplateId = defaultTemplateResponse.data.defaultTemplateId;

            // If no default template but templates exist, use first one
            if (
              !defaultTemplateId &&
              defaultTemplateResponse.data.availableTemplates?.length > 0
            ) {
              defaultTemplateId =
                defaultTemplateResponse.data.availableTemplates[0].id;
            }
          }
        } catch (templateError) {
          logger.warn(
            "Template detection failed, proceeding without template:",
            templateError
          );
        }

        logger.info(
          "🔍 Template check - defaultTemplateId:",
          defaultTemplateId
        );

        // Check if a template is available before proceeding
        if (!defaultTemplateId) {
          logger.info("❌ No shipping template available - showing alert");
          showAlert(
            "No shipping template found. Please create or link a shipping template to this order before printing.",
            "warning"
          );
          setIsPrintingShippingSlip(false);
          return;
        }

        logger.info("✅ Template found, proceeding with PDF generation");

        // Use enhanced PDF service
        const result = await enhancedPDFService.generateAndOpenShippingSlip(
          orderId,
          defaultTemplateId
        );

        if (result.success) {
          showAlert("Gönderi belgesi hazırlandı ve açıldı", "success");
          if (!result.accessible) {
            showAlert(
              "Gönderi belgesi oluşturuldu ancak ağ erişimi sınırlı olabilir. PDF dosyası indirilen dosyalarınızda.",
              "warning"
            );
          }
        } else {
          throw new Error(result.message || result.error);
        }
      } catch (error) {
        logger.error("❌ Error printing shipping slip:", error);
        showAlert(
          `Gönderi belgesi yazdırılırken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setIsPrintingShippingSlip(false);
      }
    },
    [showAlert, isPrintingShippingSlip]
  );

  // Enhanced print invoice using new service
  const handlePrintInvoice = useCallback(
    async (orderId) => {
      if (isPrintingInvoice) {
        logger.info("⚠️ Already printing invoice, ignoring request");
        return;
      }

      if (!orderId) {
        showAlert("Sipariş kimliği eksik", "error");
        return;
      }

      setIsPrintingInvoice(true);

      try {
        const result = await enhancedPDFService.generateAndOpenInvoice(orderId);

        if (result.success) {
          showAlert("Fatura hazırlandı ve açıldı", "success");
          if (!result.accessible) {
            showAlert(
              "Fatura oluşturuldu ancak ağ erişimi sınırlı olabilir. PDF dosyası indirilen dosyalarınızda.",
              "warning"
            );
          }
        } else {
          throw new Error(result.message || result.error);
        }
      } catch (error) {
        logger.error("Error printing invoice:", error);
        showAlert(
          `Fatura yazdırılırken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setIsPrintingInvoice(false);
      }
    },
    [showAlert, isPrintingInvoice]
  );

  // QNB Finans invoice generation
  const handleQNBFinansInvoice = useCallback(
    async (orderId, documentType = "auto") => {
      if (isPrintingInvoice) {
        logger.info("⚠️ Already printing QNB Finans invoice, ignoring request");
        return;
      }

      if (!orderId) {
        showAlert("Sipariş kimliği eksik", "error");
        return;
      }

      setIsPrintingInvoice(true);

      try {
        let result;

        if (documentType === "auto") {
          // Let the service determine the appropriate document type
          result = await qnbFinansService.autoGenerateDocument(orderId);
        } else if (documentType === "einvoice") {
          result = await qnbFinansService.generateEInvoice(orderId);
        } else if (documentType === "earsiv") {
          result = await qnbFinansService.generateEArchive(orderId);
        } else {
          throw new Error("Geçersiz belge tipi");
        }

        if (result.success) {
          const docType =
            documentType === "einvoice" || result.data?.invoiceNumber
              ? "E-Fatura"
              : "E-Arşiv";
          showAlert(`${docType} başarıyla oluşturuldu`, "success");

          // Open PDF if available
          if (result.data?.pdfUrl) {
            window.open(result.data.pdfUrl, "_blank");
          }
        } else {
          throw new Error(result.message || result.error);
        }
      } catch (error) {
        logger.error("Error generating QNB Finans invoice:", error);
        showAlert(
          `QNB Finans fatura oluşturulurken hata oluştu: ${qnbFinansService.formatErrorMessage(
            error
          )}`,
          "error"
        );
      } finally {
        setIsPrintingInvoice(false);
      }
    },
    [showAlert, isPrintingInvoice]
  );

  // Handle cancel order with dialog
  const handleCancelOrder = useCallback(
    (orderId, reason) => {
      setShowCancelDialog(false);
      if (onCancel) {
        onCancel(orderId, reason);
      }
    },
    [onCancel]
  );

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Accept Order Button - only show for new/pending orders */}
        {(order.orderStatus === "new" || order.orderStatus === "pending") && (
          <button
            onClick={() => onAccept(order.id)}
            className="pazar-btn pazar-btn-ghost pazar-btn-sm p-1 text-success-600 hover:text-success-700"
            title="Siparişi Onayla"
            aria-label="Siparişi Onayla"
          >
            <CheckCircle className="h-4 w-4 icon-contrast-success" />
          </button>
        )}

        <button
          onClick={() => onView && onView(order)}
          className="pazar-btn pazar-btn-ghost pazar-btn-sm p-1"
          title="Görüntüle"
          aria-label="Siparişi Görüntüle"
          disabled={!onView}
        >
          <Eye className="h-4 w-4 icon-contrast-primary" />
        </button>

        <button
          onClick={() => onEdit && onEdit(order)}
          className="pazar-btn pazar-btn-ghost pazar-btn-sm p-1"
          title="Düzenle"
          aria-label="Siparişi Düzenle"
          disabled={!onEdit}
        >
          <Edit className="h-4 w-4 icon-contrast-secondary" />
        </button>

        <button
          onClick={() => onViewDetail && onViewDetail(order.id)}
          className="pazar-btn pazar-btn-ghost pazar-btn-sm p-1"
          title="Detaylar"
          aria-label="Sipariş Detayları"
          disabled={!onViewDetail}
        >
          <MoreHorizontal className="h-4 w-4 icon-contrast-secondary" />
        </button>

        <button
          onClick={() => handlePrintShippingSlip(order.id)}
          className="pazar-btn pazar-btn-ghost pazar-btn-sm p-1"
          disabled={isPrintingShippingSlip}
          title={
            isPrintingShippingSlip
              ? "Gönderi belgesi hazırlanıyor..."
              : "Gönderi Belgesi Yazdır"
          }
          aria-label={
            isPrintingShippingSlip
              ? "Gönderi belgesi hazırlanıyor"
              : "Gönderi Belgesi Yazdır"
          }
        >
          <Printer className="h-4 w-4" />
        </button>

        {/* Invoice Generation Dropdown */}
        <DropdownMenu
          trigger={
            <button
              className="pazar-btn pazar-btn-ghost pazar-btn-sm p-1 flex items-center gap-1"
              disabled={isPrintingInvoice}
              title={
                isPrintingInvoice
                  ? "Fatura hazırlanıyor..."
                  : "Fatura Seçenekleri"
              }
              aria-label={
                isPrintingInvoice ? "Fatura hazırlanıyor" : "Fatura Seçenekleri"
              }
            >
              <FileText className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
          }
          items={[
            {
              label: "Standart Fatura",
              onClick: () => handlePrintInvoice(order.id),
              disabled: isPrintingInvoice,
            },
            {
              label: "QNB Finans (Otomatik)",
              onClick: () => handleQNBFinansInvoice(order.id, "auto"),
              disabled: isPrintingInvoice,
            },
            {
              label: "QNB E-Fatura",
              onClick: () => handleQNBFinansInvoice(order.id, "einvoice"),
              disabled: isPrintingInvoice,
            },
            {
              label: "QNB E-Arşiv",
              onClick: () => handleQNBFinansInvoice(order.id, "earsiv"),
              disabled: isPrintingInvoice,
            },
          ]}
        />

        <button
          onClick={() => setShowCancelDialog(true)}
          className="pazar-btn pazar-btn-ghost pazar-btn-sm p-1 text-danger-600 hover:text-danger-700"
          title="Siparişi İptal Et"
          aria-label="Siparişi İptal Et"
        >
          <Ban className="h-4 w-4" />
        </button>

        <button
          onClick={() => onDelete(order.id)}
          className="pazar-btn pazar-btn-ghost pazar-btn-sm p-1 text-danger-600 hover:text-danger-700"
          title="Siparişi Sil"
          aria-label="Siparişi Sil"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Cancel Order Dialog */}
      {showCancelDialog && (
        <CancelOrderDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancelOrder}
        />
      )}
    </>
  );
};

export default OrderActions;
