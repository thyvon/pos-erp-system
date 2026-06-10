'use client'

import { useState, type ReactNode } from 'react'
import { DeleteOutlined, EditOutlined, MoreVert, VisibilityOutlined } from '@/components/ui/icons'
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'

interface RowActionsProps {
  viewLabel?: string
  editLabel: string
  deleteLabel: string
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
  deleteDisabled?: boolean
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  children?: ReactNode
}

export function RowActions({
  viewLabel,
  editLabel,
  deleteLabel,
  showView = false,
  showEdit = true,
  showDelete = true,
  deleteDisabled = false,
  onView,
  onEdit,
  onDelete,
  children,
}: RowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = !!anchorEl

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    handleClose()
    onEdit?.()
  }

  const handleView = () => {
    handleClose()
    onView?.()
  }

  const handleDelete = () => {
    handleClose()
    onDelete?.()
  }

  if (!showView && !showEdit && !showDelete) return null

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label="Open row actions"
          aria-controls={open ? 'row-actions-menu' : undefined}
          aria-haspopup="menu"
          aria-expanded={open ? 'true' : undefined}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        id="row-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
      {showView && (
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <VisibilityOutlined />
          </ListItemIcon>
          <ListItemText>{viewLabel}</ListItemText>
        </MenuItem>
      )}
      {showEdit && (
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditOutlined />
          </ListItemIcon>
          <ListItemText>{editLabel}</ListItemText>
        </MenuItem>
      )}
      {showDelete && (
        <MenuItem onClick={handleDelete} disabled={deleteDisabled} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteOutlined />
          </ListItemIcon>
          <ListItemText>{deleteLabel}</ListItemText>
        </MenuItem>
      )}
      {children}
    </Menu>
    </>
  )
}
