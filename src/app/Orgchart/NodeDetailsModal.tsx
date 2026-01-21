import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface NodeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: any | null;
}

export default function NodeDetailsModal({
    isOpen,
    onClose,
    nodeData
}: NodeDetailsModalProps) {
    if (!nodeData) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-2xl transition-all">

                                {/* Header / Banner Background */}
                                <div className="h-32 bg-gradient-to-r from-[#DB011C] to-[#8f0012] relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                                        {/* Assuming logo is in public folder */}
                                        <img
                                            src="/milwaukee_logo.png"
                                            alt="Milwaukee Tool"
                                            className="h-24 w-auto object-contain"
                                        />
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors z-10"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="px-8 pb-8">
                                    {/* Profile Image - Overlapping Header */}
                                    <div className="relative -mt-16 mb-4 flex justify-center z-10">
                                        <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                                            {nodeData.img ? (
                                                <img
                                                    src={nodeData.img}
                                                    alt={nodeData.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
                                                    <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Main Info */}
                                    <div className="text-center mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                                            {nodeData.name || "Unnamed"}
                                        </h3>
                                        <p className="text-sm font-semibold text-[#DB011C] uppercase tracking-wide mt-1">
                                            {nodeData.title || "No Title"}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {nodeData.dept || "No Department"}
                                        </p>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-gray-100 w-full mb-6"></div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">

                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Employee ID</p>
                                            <p className="font-medium text-gray-800 break-all">{nodeData.id}</p>
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Unit</p>
                                            <p className="font-medium text-gray-800">{nodeData.BU || "-"}</p>
                                        </div>

                                        {/* NEW FIELD: Employee Type */}
                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</p>
                                            <p className="font-medium text-gray-800">{nodeData.type || "-"}</p>
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                                            <p className="font-medium text-gray-800">{nodeData.location || "-"}</p>
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Joining Date</p>
                                            <p className="font-medium text-gray-800">{nodeData.joiningDate || "-"}</p>
                                        </div>

                                        {nodeData.description && (
                                            <div className="col-span-2 mt-2">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                                                <div className="p-3 bg-gray-50 rounded-lg text-gray-600 text-sm leading-relaxed">
                                                    {nodeData.description}
                                                </div>
                                            </div>
                                        )}

                                        {nodeData.tags && nodeData.tags.length > 0 && (
                                            <div className="col-span-2 mt-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {nodeData.tags.map((tag: string, index: number) => (
                                                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
