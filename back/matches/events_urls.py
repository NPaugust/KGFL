from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GoalViewSet, CardViewSet

router = DefaultRouter()
router.register(r'goals', GoalViewSet)
router.register(r'cards', CardViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

