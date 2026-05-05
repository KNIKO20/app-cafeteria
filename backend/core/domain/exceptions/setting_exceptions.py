class SettingException(Exception):
    pass
class CafeteriaClosedError(SettingException):
    def __init__(self, msg: str):
        self.message = f"{msg}"
        super().__init__()