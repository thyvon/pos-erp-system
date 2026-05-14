'use client'

import { useState } from 'react'
import { DeleteOutlined, EditOutlined, MoreVert } from '@mui/icons-material'
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'

interface RowActionsProps {
  editLabel: string
  deleteLabel: string
  showEdit?: boolean
  showDelete?: boolean
  deleteDisabled?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function RowActions({
  editLabel,
  deleteLabel,
  showEdit = true,
  showDelete = true,
  deleteDisabled = false,
  onEdit,
  onDelete,
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

  const handleDelete = () => {
    handleClose()
    onDelete?.()
  }

  if (!showEdit && !showDelete) return null

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
      </Menu>
    </>
  )
}
