#include <iostream>
#include <fstream>

std::string readFile(const char *filePath) // Mights just use a C approach instead
{
    std::string content;
    std::ifstream fileStream(filePath, std::ios::in);

    if(!fileStream.is_open()) {
        std::cerr << "Could not read file " << filePath << ". File does not exist." << std::endl;
        return "";
    }

    std::string line = "";
    while(!fileStream.eof()) {
        std::getline(fileStream, line);
        content.append(line + "\n");
    }

    fileStream.close();
    return content;
}


std::string getFileExtension(std::string &fileName)
{

    auto i = fileName.rbegin();
    while(i != fileName.rend())
    {
        if(*i == '.') break;
    }

    
};