"""
Notification nodes
"""
from .base import BaseNode
from typing import Dict, Any, Optional
from app.models import Notification
from app.database import AsyncSessionLocal


class DashboardNotificationNode(BaseNode):
    """Send notification to dashboard"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Get notification details
        title = self.config.get('title', 'Workflow Notification')
        message = self.config.get('message', 'Workflow executed successfully')
        notification_type = self.config.get('type', 'info')
        user_id = self.config.get('user_id')
        
        # Get user_id from input if not in config
        if not user_id and input_data:
            user_id = input_data.get('user_id')
        
        if not user_id:
            # Skip notification if no user_id (for now)
            return {
                'success': True,
                'notification_id': None,
                'title': title,
                'message': message,
                'type': notification_type,
                'skipped': True
            }
        
        # Create notification in database
        async with AsyncSessionLocal() as db:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type
            )
            db.add(notification)
            await db.commit()
            await db.refresh(notification)
            
            return {
                'success': True,
                'notification_id': notification.id,
                'title': title,
                'message': message,
                'type': notification_type
            }
    
    def get_outputs(self) -> list:
        return ['success', 'notification_id', 'title', 'message', 'type']
