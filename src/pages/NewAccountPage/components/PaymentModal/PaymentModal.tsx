/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "../../../../components/ui";
import { Dialog, DialogContent } from "../../../../components/ui/dialog";
import { Exam } from "../../../../types";

// Import payment brand images
import VisaIcon from "../../../../assets/brands/visa.svg";
import MastercardIcon from "../../../../assets/brands/mastercard.svg";
import ApplePayIcon from "../../../../assets/brands/apple-pay.svg";
import GooglePayIcon from "../../../../assets/brands/google-pay.svg";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  examData: Exam;
  isBasic: boolean;
  onSubmit: (data: Exam, isBasic: boolean) => Promise<void>;
}

type PaymentTab = "card" | "paypal";

interface PaymentMethodItem {
  id: string;
  name: string;
  icon: string;
  type: "card" | "wallet";
}

// Payment methods configuration
const PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: "visa",
    name: "Visa",
    icon: VisaIcon,
    type: "card",
  },
  {
    id: "mastercard",
    name: "Master Card",
    icon: MastercardIcon,
    type: "card",
  },
  {
    id: "applepay",
    name: "Apple Pay",
    icon: ApplePayIcon,
    type: "wallet",
  },
  {
    id: "googlepay",
    name: "Google Pay",
    icon: GooglePayIcon,
    type: "wallet",
  },
];

// Form field configuration
interface FormField {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "number";
  required?: boolean;
  gridCol?: "full" | "half";
}

const FORM_FIELDS: FormField[] = [
  {
    id: "email",
    label: "Email address",
    placeholder: "mail@email.com",
    type: "email",
    required: true,
    gridCol: "full",
  },
  {
    id: "cardNumber",
    label: "Card number",
    placeholder: "Enter card number",
    type: "text",
    required: true,
    gridCol: "full",
  },
  {
    id: "expirationDate",
    label: "Expiration date",
    placeholder: "MM/YY",
    type: "text",
    required: true,
    gridCol: "half",
  },
  {
    id: "securityCode",
    label: "Security code",
    placeholder: "CVV",
    type: "text",
    required: true,
    gridCol: "half",
  },
  {
    id: "cardholderName",
    label: "Cardholder name",
    placeholder: "Enter cardholder name",
    type: "text",
    required: true,
    gridCol: "full",
  },
  {
    id: "taxId",
    label: "Tax ID number (optional)",
    placeholder: "Enter tax ID",
    type: "text",
    required: false,
    gridCol: "full",
  },
];

export default function PaymentModal({
  isOpen,
  onClose,
  examData,
  isBasic,
  onSubmit,
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("card");
  const [selectedMethod, setSelectedMethod] = useState<string>("visa");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    cardNumber: "",
    expirationDate: "",
    securityCode: "",
    cardholderName: "",
    taxId: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Call the handlePurchase function from NewAccountPage
      await onSubmit(examData, isBasic);
      onClose();
    } catch (error: any) {
      console.error("Payment failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = examData.fee;
  const total = examData.fee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0">
        {/* Header with Tabs */}
        <div className="border-b border-btnBorder sticky top-0 bg-sectionBg z-10 rounded-t-2xl">
          <div className="flex items-center p-6 pb-0">
            <div className="flex-1 flex gap-6">
              <button
                onClick={() => setActiveTab("card")}
                className={`flex-1 pb-4 text-base transition-colors border-b-2 ${
                  activeTab === "card"
                    ? "text-white border-highlight"
                    : "text-textBtn border-transparent hover:text-white"
                }`}
              >
                Pay by Card
              </button>
              <button
                onClick={() => setActiveTab("paypal")}
                className={`flex-1 pb-4 text-base transition-colors border-b-2 ${
                  activeTab === "paypal"
                    ? "text-white border-highlight"
                    : "text-textBtn border-transparent hover:text-white"
                }`}
              >
                Pay with PayPal
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "card" ? (
            <div key={activeTab} className="fade-in space-y-6">
              {/* Payment Methods */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-2xl border transition-all ${
                      selectedMethod === method.id
                        ? "bg-primaryBg border-highlight"
                        : "bg-primaryBg/50 border-btnBorder hover:border-textBtn"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <img
                        src={method.icon}
                        alt={method.name}
                        className="h-6 w-auto object-contain"
                      />
                      <span className="text-xs text-textBtn">
                        {method.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Secure Payment Link */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-textBtn text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Secure payment link</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <button className="text-highlight text-sm hover:underline">
                  Learn more
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {FORM_FIELDS.map((field, index) => {
                  // Check if this is the start of half-width fields
                  const nextField = FORM_FIELDS[index + 1];
                  const isHalfStart =
                    field.gridCol === "half" &&
                    (index === 0 || FORM_FIELDS[index - 1].gridCol !== "half");

                  // If it's a half-width field and the start of a pair
                  if (isHalfStart && nextField?.gridCol === "half") {
                    return (
                      <div key={field.id} className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-textBtn mb-2">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.id as keyof typeof formData]}
                            onChange={(e) =>
                              handleInputChange(field.id, e.target.value)
                            }
                            required={field.required}
                            className="w-full px-4 py-3 bg-primaryBg border border-btnBorder rounded-2xl text-white placeholder-textBtn/50 focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-textBtn mb-2">
                            {nextField.label}
                          </label>
                          <input
                            type={nextField.type}
                            placeholder={nextField.placeholder}
                            value={
                              formData[nextField.id as keyof typeof formData]
                            }
                            onChange={(e) =>
                              handleInputChange(nextField.id, e.target.value)
                            }
                            required={nextField.required}
                            className="w-full px-4 py-3 bg-primaryBg border border-btnBorder rounded-2xl text-white placeholder-textBtn/50 focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    );
                  }

                  // Skip if it's the second half-width field (already rendered)
                  if (
                    field.gridCol === "half" &&
                    index > 0 &&
                    FORM_FIELDS[index - 1].gridCol === "half"
                  ) {
                    return null;
                  }

                  // Render full-width field
                  if (field.gridCol === "full") {
                    return (
                      <div key={field.id}>
                        <label className="block text-sm text-textBtn mb-2">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.id as keyof typeof formData]}
                          onChange={(e) =>
                            handleInputChange(field.id, e.target.value)
                          }
                          required={field.required}
                          className="w-full px-4 py-3 bg-primaryBg border border-btnBorder rounded-2xl text-white placeholder-textBtn/50 focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent transition-all"
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Subtotal and Total */}
              <div className="space-y-3 pt-4 border-t border-btnBorder">
                <div className="flex items-center justify-between">
                  <span className="text-textBtn">Subtotal</span>
                  <span className="text-white font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-textBtn font-medium">Total</span>
                  <span className="text-white font-bold text-lg">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div key={activeTab} className="fade-in py-12 text-center">
              <p className="text-textBtn mb-4">
                PayPal integration coming soon
              </p>
              <Button variant="outline" size="md" onClick={onClose}>
                Go Back
              </Button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {activeTab === "card" && (
          <div className="p-6 pt-0 flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              size="lg"
              fullWidth
              className="border-outlineBg!"
              disabled={loading}
            >
              Close
            </Button>
            <Button
              onClick={handlePayment}
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              className="bg-highlight! text-primary! hover:opacity-60 transition-all"
            >
              Pay
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
