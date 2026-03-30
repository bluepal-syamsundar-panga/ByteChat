import Modal from './Modal';

const UnsavedChangesModal = ({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Discard changes?',
  message = 'You have unsaved changes. Are you sure you want to close this popup?',
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    rounded="rounded-none"
  >
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-[#6b6a6b]">
        {message}
      </p>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-bold text-[#6b6a6b] transition-smooth hover:bg-black/5"
        >
          Keep editing
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-smooth hover:bg-rose-700"
        >
          Discard
        </button>
      </div>
    </div>
  </Modal>
);

export default UnsavedChangesModal;
