#include <iostream>
#include <fstream>
#include <Utils.hpp>

std::string readFile(const std::string& filePath) // Mights just use a C approach instead
{
    std::string content;
    std::ifstream fileStream(filePath, std::ios::in);

    if(!fileStream.is_open()) {
        std::cerr << TERMINAL_ERROR << "Could not read file " << filePath << ". File does not exist." << TERMINAL_RESET<< std::endl;
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


std::string getFileExtension(const std::string &fileName)
{
    std::string result;

    auto i = fileName.rbegin();
    while(i != fileName.rend())
    {
        if(*i == '.') break;

        result = *i + result;

        i++;
    }

    return result;
};