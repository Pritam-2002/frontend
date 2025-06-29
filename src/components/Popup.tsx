"use client";

import Modal from "react-modal";
import { useState } from "react";

export default function AttributeInfoPopup({ value }: { value: string }) {
    const [isOpen, setIsOpen] = useState(false);

    let parsed: any;
    let isJSON = true;

    try {
        parsed = JSON.parse(value || "{}");
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            isJSON = false;
        }
    } catch {
        isJSON = false;
        parsed = value;
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-blue-600 hover:underline hover:text-blue-800 transition-all duration-200"
            >
                View
            </button>

            <Modal
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                contentLabel="Attribute Details"
                ariaHideApp={false}
                className="max-w-2xl w-[90%] bg-white rounded-xl p-6 shadow-lg outline-none mx-auto mt-20 max-h-[80vh] overflow-y-auto"
                overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50"
            >
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-4 text-2xl text-gray-500 hover:text-black"
                >
                    &times;
                </button>

                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Client Attributes</h2>

                {isJSON ? (
                    <div className="space-y-3">
                        {Object.entries(parsed).map(([key, val]) => (
                            <div
                                key={key}
                                className="flex justify-between border-b pb-1 text-gray-800"
                            >
                                <span className="font-medium capitalize">{key}</span>
                                <span className="text-sm text-right break-words max-w-[60%]">{String(val)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-700 bg-gray-100 border rounded p-4 text-sm whitespace-pre-line">
                        {parsed}
                    </p>
                )}
            </Modal>
        </>
    );
}
