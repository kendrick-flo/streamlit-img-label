import setuptools

setuptools.setup(
    name="streamlit_img_label",
    version="0.1.1",
    author="Jung Seok Sung",
    author_email="jssung@dreamus.com",
    description="Streamlit Image Annotation",
    long_description="It is a image annotation tool. You can use to do preprocessing of computer vision tasks.",
    long_description_content_type="text/plain",
    url="https://github.com/kendrick-flo/streamlit-img-label",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[],
    python_requires=">=3.6",
    install_requires=[
        # By definition, a Custom Component depends on Streamlit.
        # If your component has other Python dependencies, list
        # them here.
        "streamlit >= 0.63",
    ],
)
