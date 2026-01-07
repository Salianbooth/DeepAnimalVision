# recognition/predict.py
from recognition.inference import detect_animals
from pathlib import Path  # 新增：导入Path处理路径

if __name__ == "__main__":
    # 核心修改：基于脚本所在目录构建图片的绝对路径
    # 获取predict.py所在的目录（recognition文件夹）
    current_dir = Path(__file__).resolve().parent
    # 拼接图片路径（确保bus.jpg在recognition文件夹下）
    image_path = str(current_dir / "bus.jpg")

    # 打印路径，方便排查（可选，毕设调试时建议保留）
    print(f"正在检测图片：{image_path}")

    results = detect_animals(image_path)

    for obj in results:
        print(obj)