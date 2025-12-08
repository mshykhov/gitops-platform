import { useEffect } from "react";
import { Modal, Form, Input } from "antd";
import type { Item, ItemFormData } from "@/types";

interface ItemFormModalProps {
  open: boolean;
  item: Item | null;
  loading: boolean;
  onSubmit: (data: ItemFormData) => void;
  onCancel: () => void;
}

export const ItemFormModal = ({ open, item, loading, onSubmit, onCancel }: ItemFormModalProps) => {
  const [form] = Form.useForm<ItemFormData>();
  const isEdit = !!item;

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        item ? { name: item.name, description: item.description || "" } : { name: "", description: "" }
      );
    }
  }, [open, item, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title={isEdit ? "Edit Item" : "Create Item"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please enter item name" }]}>
          <Input placeholder="Enter item name" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Enter description (optional)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
