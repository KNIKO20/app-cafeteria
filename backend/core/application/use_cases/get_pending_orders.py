# core/application/use_cases/get_pending_orders.py

class GetPendingOrdersUseCase:
    def __init__(self, order_repository):
        self.order_repository = order_repository

    def execute(self):
        # Esta lógica la usará el personal de cafetería
        return self.order_repository.find_pending()