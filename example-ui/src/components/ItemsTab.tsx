import { useEffect, useState } from "react";
import { Table, Button, Space, Typography, Popconfirm, message, Alert, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useItems } from "@/hooks/useItems";
import { ItemFormModal } from "./ItemFormModal";
import type { Item, ItemFormData } from "@/types";
import "@/styles/dashboard.css";

const { Text } = Typography;

export const ItemsTab = () => {
  const { items, loading, error, fetchItems, createItem, updateItem, deleteItem, isAuthenticated } = useItems();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    }
  }, [isAuthenticated, fetchItems]);

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const success = await deleteItem(id);
    if (success) {
      message.success("Item deleted");
    } else {
      message.error("Failed to delete item");
    }
  };

  const handleSubmit = async (data: ItemFormData) => {
    if (editingItem) {
      const result = await updateItem(editingItem.id, data);
      if (result) {
        message.success("Item updated");
        setModalOpen(false);
      } else {
        message.error("Failed to update item");
      }
    } else {
      const result = await createItem(data);
      if (result) {
        message.success("Item created");
        setModalOpen(false);
      } else {
        message.error("Failed to create item");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const columns: ColumnsType<Item> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string | null) => text || <Text type="secondary">—</Text>,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: formatDate,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: formatDate,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete item"
            description="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" className="tab-container">
      <Space className="tab-container" style={{ justifyContent: "space-between" }}>
        <Text type="secondary">{items.length} items</Text>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchItems} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Item
          </Button>
        </Space>
      </Space>

      {error && <Alert message={error} type="error" showIcon closable />}

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} items` }}
          size="middle"
        />
      </Card>

      <ItemFormModal
        open={modalOpen}
        item={editingItem}
        loading={loading}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </Space>
  );
};
